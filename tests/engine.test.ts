import { describe, expect, it } from 'vitest';
import { DIFFICULTY_ORDER, REVEAL_CURVES, SCORING } from '../src/config/gameConfig';
import { pickFocus } from '../src/domain/imageReveal';
import { FOCUS } from '../src/modes/shared';
import { loadGameContent } from '../src/content/gameContent';
import { findAnswer, searchAnswers } from '../src/domain/answerValidator';
import { GuessingGameEngine } from '../src/domain/guessingEngine';
import { appendToHistory, selectQuestion } from '../src/domain/questionSelector';
import { calculateScore, timePenalty } from '../src/domain/scoreCalculator';
import type { DifficultyId, ModeDefinition, ModeId } from '../src/domain/rules';
import { buildShareText, EMPTY_BOOK, recordInBook, summarizeStats } from '../src/domain/statistics';
import { createModeCatalog } from '../src/modes/modeCatalog';

const content = loadGameContent();
const catalog = createModeCatalog(content);

function startEngine(modeId: ModeId, questionId: string, difficulty: DifficultyId = 'normal') {
  const mode = catalog.mode(modeId);
  const question = mode.questions.find((item) => item.id === questionId);
  if (!question) throw new Error(`Pergunta ${questionId} não existe em ${modeId}`);
  let clock = 0;
  const engine = new GuessingGameEngine({
    mode,
    preset: mode.difficulties[difficulty],
    scoring: SCORING,
    now: () => clock,
    random: () => 0.5,
  });
  engine.beginLoading(question);
  engine.markReady();
  return { engine, mode, question, advance: (ms: number) => (clock += ms) };
}

const wrongAnswers = (mode: ModeDefinition, correctId: string, count: number) =>
  mode.answers.filter((answer) => answer.id !== correctId).slice(0, count);

describe('catálogo de conteúdo', () => {
  it('carrega agentes, habilidades, armas e skins sem duplicados ou referências quebradas', () => {
    expect(content.agents.length).toBeGreaterThan(20);
    expect(content.abilities.length).toBe(content.agents.length * 4);
    expect(content.weapons.map((weapon) => weapon.id)).toEqual(expect.arrayContaining(['vandal', 'phantom', 'operator', 'confronto']));
    expect(content.skins.length).toBeGreaterThan(100);
  });

  it('todo modo tem desafios, respostas e a resposta de cada desafio está na lista', () => {
    for (const challenge of catalog.challenges) {
      for (const mode of challenge.modes) {
        expect(mode.questions.length).toBeGreaterThan(0);
        const answerIds = new Set(mode.answers.map((answer) => answer.id));
        mode.questions.forEach((question) => expect(answerIds.has(question.answer.id)).toBe(true));
      }
    }
  });

  it('pistas de habilidade não revelam o nome da habilidade nem do agente', () => {
    for (const mode of [catalog.mode('ability'), catalog.mode('ability-agent')]) {
      for (const question of mode.questions) {
        const description = question.hints.find((hint) => hint.kind === 'description')?.value ?? '';
        const [agentName] = question.details.filter((detail) => detail.label === 'Agente').map((detail) => detail.value);
        expect(description.toLowerCase()).not.toContain(`${agentName.toLowerCase()} `);
        if (mode.id === 'ability') expect(description).not.toContain(question.answer.name);
      }
    }
  });
});

describe('validação de respostas', () => {
  it('aceita variações de escrita, apelidos e rejeita nomes inexistentes', () => {
    const agents = catalog.mode('agent-classic').answers;
    const weapons = catalog.mode('weapon').answers;
    expect(findAnswer('kay/o', agents)?.name).toBe('KAY/O');
    expect(findAnswer('  VANDAL ', weapons)?.id).toBe('vandal');
    expect(findAnswer('faca', weapons)?.id).toBe('confronto');
    expect(findAnswer('Batman', weapons)).toBeNull();
  });

  it('prioriza prefixos e exclui respostas já tentadas', () => {
    const agents = catalog.mode('agent-classic').answers;
    const names = searchAnswers('ra', agents).map((answer) => answer.name);
    expect(names[0]).toBe('Raze');
    expect(names).toContain('Astra');
    expect(searchAnswers('jet', agents, new Set(['jett']))).toHaveLength(0);
  });

  it('modo coleção valida pelo nome da coleção, não da skin', () => {
    const { engine, question, mode } = startEngine('skin-collection', content.skins[0].id);
    expect(mode.answerType).toBe('collection');
    expect(engine.submitGuess(content.skins[0].name).kind).toBe('invalid');
    expect(engine.submitGuess(question.answer.name).kind).toBe('correct');
  });
});

describe('seleção de desafios', () => {
  it('nunca repete o desafio imediatamente anterior e evita os recentes', () => {
    const weapons = catalog.mode('weapon').questions;
    for (let i = 0; i < 100; i += 1) {
      expect(selectQuestion(weapons, { recentIds: ['vandal'], avoidRatio: 0 }).id).not.toBe('vandal');
    }
    const recent = weapons.slice(0, 12).map((question) => question.id);
    for (let i = 0; i < 50; i += 1) {
      expect(recent).not.toContain(selectQuestion(weapons, { recentIds: recent, avoidRatio: 0.6 }).id);
    }
  });

  it('limita o tamanho do histórico', () => {
    expect(appendToHistory(['a', 'b', 'c'], 'd', 3)).toEqual(['b', 'c', 'd']);
  });
});

describe('dificuldade por modo', () => {
  it('armas: categoria sempre visível no fácil e escondida no difícil', () => {
    expect(startEngine('weapon', 'vandal', 'easy').engine.snapshot().pinnedHints.map((hint) => hint.kind)).toEqual(['category']);
    const hard = startEngine('weapon', 'vandal', 'hard');
    ['Phantom', 'Guardian', 'Bulldog', 'Odin'].forEach((name) => hard.engine.submitGuess(name));
    expect(hard.engine.snapshot().hints.map((hint) => hint.kind)).not.toContain('category');
  });

  it('skins: revelação específica com blur em queda e cores voltando', () => {
    const { engine, mode } = startEngine('skin', content.skins[0].id);
    const levels = [engine.snapshot().visual];
    wrongAnswers(mode, content.skins[0].id, 5).forEach((answer) => {
      engine.submitGuess(answer.name);
      levels.push(engine.snapshot().visual);
    });
    expect(levels[0].saturation).toBe(0);
    for (let i = 1; i < levels.length; i += 1) {
      expect(levels[i].blur).toBeLessThanOrEqual(levels[i - 1].blur);
      expect(levels[i].saturation).toBeGreaterThanOrEqual(levels[i - 1].saturation);
    }
  });

  it('habilidades: no difícil não mostra agente, função nem tecla', () => {
    const { engine, mode } = startEngine('ability', 'jett-x', 'hard');
    wrongAnswers(mode, 'jett-x', 4).forEach((answer) => engine.submitGuess(answer.name));
    const kinds = engine.snapshot().hints.map((hint) => hint.kind);
    expect(kinds).not.toContain('agent');
    expect(kinds).not.toContain('role');
    expect(kinds).not.toContain('slot');
  });
});

describe('pixelização e região inicial', () => {
  it('quanto mais difícil, mais grossos os pixels no início', () => {
    for (const curve of Object.values(REVEAL_CURVES)) {
      const initial = DIFFICULTY_ORDER.map((id) => curve[id][0].pixels);
      for (let i = 1; i < initial.length; i += 1) expect(initial[i]).toBeLessThan(initial[i - 1]);
    }
  });

  it('cada erro deixa os pixels mais finos até a imagem nítida', () => {
    for (const curve of Object.values(REVEAL_CURVES)) {
      for (const id of DIFFICULTY_ORDER) {
        const steps = curve[id].map((level) => (level.pixels === 0 ? Infinity : level.pixels));
        for (let i = 1; i < steps.length; i += 1) expect(steps[i]).toBeGreaterThan(steps[i - 1]);
      }
    }
  });

  it('sorteia a região inicial entre superior, inferior, laterais e centro', () => {
    let seed = 7;
    const random = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const anchors = new Set(Array.from({ length: 200 }, () => pickFocus(FOCUS.portrait, random).anchor));
    expect([...anchors].sort()).toEqual(['bottom', 'center', 'left', 'right', 'top']);
    const top = pickFocus(FOCUS.wide, () => 0);
    expect(top.anchor).toBe('top');
    expect(top.point.y).toBeLessThan(FOCUS.wide.center.y);
  });

  it('ao terminar a rodada a imagem fica sem pixelização', () => {
    const { engine } = startEngine('weapon', 'vandal', 'insane');
    engine.submitGuess('Vandal');
    expect(engine.snapshot().visual).toMatchObject({ pixels: 0, blur: 0, reveal: 100 });
  });
});

describe('partida genérica', () => {
  it('agente: erros revelam imagem e pistas até o acerto', () => {
    const { engine, advance } = startEngine('agent-classic', 'jett');
    expect(engine.snapshot().visual).toMatchObject({ pixels: 12, reveal: 15 });
    const miss = engine.submitGuess('Phoenix');
    expect(miss.kind).toBe('incorrect');
    expect(engine.snapshot().visual).toMatchObject({ pixels: 18, reveal: 30 });
    expect(engine.snapshot().hints.map((hint) => hint.kind)).toEqual(['role']);
    expect(engine.submitGuess('Phoenix').kind).toBe('duplicate');
    expect(engine.submitGuess('Ninguém').kind).toBe('invalid');
    advance(4_000);
    expect(engine.submitGuess('Jett').kind).toBe('correct');
    const summary = engine.snapshot().summary!;
    expect(summary).toMatchObject({ won: true, attempts: 2, hintsUsed: 1, challenge: 'agents' });
    expect(engine.snapshot().visual.reveal).toBe(100);
    engine.showResult();
    expect(engine.status).toBe('RESULT');
  });

  it('habilidade: acerta pelo nome e o resultado traz agente e função', () => {
    const { engine, question } = startEngine('ability', 'jett-x');
    expect(engine.submitGuess(question.answer.name).kind).toBe('correct');
    const labels = engine.snapshot().summary!.question.details.map((detail) => detail.label);
    expect(labels).toEqual(expect.arrayContaining(['Habilidade', 'Agente', 'Função']));
  });

  it('modo inverso: habilidade → agente', () => {
    const { engine } = startEngine('ability-agent', 'sage-x');
    expect(engine.submitGuess('Sage').kind).toBe('correct');
  });

  it('avisa última tentativa e entra em derrota ao esgotar', () => {
    const { engine } = startEngine('weapon', 'vandal', 'insane');
    engine.submitGuess('Phantom');
    const lastChance = engine.submitGuess('Sheriff');
    expect(lastChance.kind === 'incorrect' && lastChance.attemptsLeft).toBe(1);
    expect(engine.submitGuess('Ghost').kind).toBe('lost');
    expect(engine.status).toBe('LOST');
    expect(engine.snapshot().summary?.score.total).toBe(0);
    expect(() => engine.submitGuess('Vandal')).toThrow();
  });

  it('não expõe pistas futuras e contabiliza pistas pedidas', () => {
    const { engine } = startEngine('agent-classic', 'sage', 'insane');
    engine.submitGuess('Jett');
    expect(engine.snapshot().hints).toHaveLength(0);
    expect(engine.requestHint()?.kind).toBe('role');
    expect(engine.snapshot().hints).toHaveLength(1);
  });
});

describe('pontuação', () => {
  it('aplica penalidades, multiplicador e mínimo', () => {
    const input = { won: true, wrongGuesses: 2, hintsUsed: 1, revealLevel: 2, elapsedMs: 5_000, multiplier: 1 };
    expect(calculateScore(input, SCORING).total).toBe(1000 - 200 - 50 - 40);
    expect(calculateScore({ ...input, won: false }, SCORING).total).toBe(0);
  });

  it('penaliza tempo de forma progressiva e limitada', () => {
    expect(timePenalty(10_000, SCORING.time)).toBe(0);
    const early = timePenalty(20_000, SCORING.time);
    expect(timePenalty(30_000, SCORING.time) - early).toBeGreaterThan(early);
    expect(timePenalty(3_600_000, SCORING.time)).toBe(SCORING.time.maxPenalty);
  });
});

describe('estatísticas e compartilhamento', () => {
  it('separa estatísticas por desafio e mantém o geral', () => {
    const agentRound = startEngine('agent-classic', 'jett');
    agentRound.engine.submitGuess('Jett');
    const weaponRound = startEngine('weapon', 'vandal', 'insane');
    ['Phantom', 'Sheriff', 'Ghost'].forEach((name) => weaponRound.engine.submitGuess(name));

    const book = recordInBook(recordInBook(EMPTY_BOOK, agentRound.engine.snapshot().summary!), weaponRound.engine.snapshot().summary!);
    expect(summarizeStats(book.overall)).toMatchObject({ played: 2, wins: 1, currentStreak: 0, bestStreak: 1 });
    expect(book.byChallenge.agents?.played).toBe(1);
    expect(book.byChallenge.weapons).toMatchObject({ played: 1, wins: 0 });
  });

  it('compartilha sem revelar a resposta e marca erro na mesma categoria em amarelo', () => {
    const { engine } = startEngine('weapon', 'vandal');
    engine.submitGuess('Phantom');
    engine.submitGuess('Sheriff');
    engine.submitGuess('Vandal');
    const text = buildShareText(engine.snapshot().summary!, { emoji: '🔫', modeLabel: 'Arma', difficultyLabel: 'Normal' });
    expect(text).toContain('🟨 🟥 🟩');
    expect(text).toContain('3 tentativas');
    expect(text).not.toMatch(/vandal/i);
  });
});
