import { describe, expect, it } from 'vitest';
import { DailyChallenge } from '../src/application/dailyChallenge';
import { GameController } from '../src/application/gameController';
import { DAILY_CHALLENGE, SCORING, SELECTION } from '../src/config/gameConfig';
import { loadGameContent } from '../src/content/gameContent';
import { localDayKey, msUntilNextLocalDay, seededRandom } from '../src/domain/dailySeed';
import type { KeyValueStore } from '../src/infrastructure/localStore';
import { createRepositories } from '../src/infrastructure/repositories';
import { createModeCatalog } from '../src/modes/modeCatalog';

const catalog = createModeCatalog(loadGameContent());

function memoryStore(): KeyValueStore {
  const data = new Map<string, string>();
  return {
    read(key, fallback, isValid) {
      const raw = data.get(key);
      if (raw === undefined) return fallback;
      const parsed: unknown = JSON.parse(raw);
      return isValid(parsed) ? parsed : fallback;
    },
    write(key, value) {
      data.set(key, JSON.stringify(value));
    },
  };
}

function setup(store = memoryStore(), date = new Date(2026, 8, 29, 10)) {
  const repositories = createRepositories(store);
  const controller = new GameController({
    catalog,
    scoring: SCORING,
    selection: SELECTION,
    repositories,
    assetUrl: (path) => path,
    preload: () => Promise.resolve(),
  });
  const clock = { now: date };
  const daily = new DailyChallenge({
    controller,
    catalog,
    modes: DAILY_CHALLENGE.modes,
    difficulty: DAILY_CHALLENGE.difficulty,
    repository: repositories.daily,
    now: () => clock.now,
  });
  return { store, controller, daily, clock };
}

async function playStage(context: ReturnType<typeof setup>, win: boolean): Promise<string> {
  await context.daily.startCurrentStage();
  const mode = context.controller.mode;
  const snapshot = context.controller.snapshot()!;
  const answer = mode.questions.find((question) => question.image === snapshot.image)!.answer;
  if (win) {
    context.controller.guess(answer.name);
  } else {
    mode.answers
      .filter((option) => option.id !== answer.id)
      .slice(0, context.controller.preset.maxAttempts)
      .forEach((option) => context.controller.guess(option.name));
  }
  context.daily.recordStageResult(context.controller.snapshot()!.summary!);
  return answer.id;
}

describe('semente diária', () => {
  it('gera a mesma sequência para a mesma semente e muda com o dia', () => {
    const a = seededRandom('2026-09-29:weapon');
    const b = seededRandom('2026-09-29:weapon');
    const c = seededRandom('2026-09-30:weapon');
    const first = [a(), a(), a()];
    expect([b(), b(), b()]).toEqual(first);
    expect([c(), c(), c()]).not.toEqual(first);
    first.forEach((value) => expect(value).toBeGreaterThanOrEqual(0));
  });

  it('usa a data local e conta o tempo até a meia-noite local', () => {
    expect(localDayKey(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
    expect(msUntilNextLocalDay(new Date(2026, 0, 5, 23, 59, 0))).toBe(60_000);
  });
});

describe('desafio do dia contínuo', () => {
  it('segue a ordem Agentes → Armas → Skins → Habilidades', () => {
    const { daily } = setup();
    expect(daily.stages().map((stage) => stage.challenge.id)).toEqual(['agents', 'weapons', 'skins', 'abilities']);
    expect(daily.status()).toBe('available');
  });

  it('todos recebem os mesmos desafios no mesmo dia', async () => {
    const first = setup();
    const second = setup();
    expect(await playStage(first, true)).toBe(await playStage(second, true));
  });

  it('continua após erro, soma pontos e só permite jogar uma vez por dia', async () => {
    const context = setup();
    await playStage(context, true);
    await playStage(context, false);
    await playStage(context, true);
    await playStage(context, true);
    expect(context.daily.status()).toBe('complete');
    expect(context.daily.stages().map((stage) => stage.record.status)).toEqual(['won', 'lost', 'won', 'won']);
    expect(context.daily.total()).toBe(context.daily.stages().reduce((sum, stage) => sum + stage.record.score, 0));
    await expect(context.daily.startCurrentStage()).rejects.toThrow(/Volte amanhã/);

    const reopened = setup(context.store);
    expect(reopened.daily.status()).toBe('complete');
  });

  it('sair ou recarregar no meio de uma etapa conta como derrota nela', async () => {
    const context = setup();
    await context.daily.startCurrentStage();
    const reloaded = setup(context.store);
    expect(reloaded.daily.stages()[0].record.status).toBe('abandoned');
    expect(reloaded.daily.currentStage()?.challenge.id).toBe('weapons');

    await reloaded.daily.startCurrentStage();
    reloaded.daily.abandonActiveStage();
    expect(reloaded.daily.stages()[1].record.status).toBe('abandoned');
  });

  it('libera um novo desafio no dia seguinte', async () => {
    const context = setup();
    for (let stage = 0; stage < 4; stage += 1) await playStage(context, true);
    context.clock.now = new Date(2026, 8, 30, 8);
    expect(context.daily.status()).toBe('available');
    expect(context.daily.day()).toBe('2026-09-30');
  });

  it('compartilha as etapas sem revelar respostas', async () => {
    const context = setup();
    const answers = [
      await playStage(context, true),
      await playStage(context, false),
      await playStage(context, true),
      await playStage(context, true),
    ];
    const text = context.daily.shareText();
    expect(text).toContain('2026-09-29');
    expect(text.split('\n').filter((line) => /^(👤|🔫|🎨|⚡)/.test(line))).toHaveLength(4);
    const names = context.daily.stages().map((stage) => stage.record.answerName!);
    names.forEach((name) => expect(text).not.toContain(name));
    expect(answers).toHaveLength(4);
  });
});
