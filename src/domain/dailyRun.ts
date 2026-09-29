import type { GuessRecord, RoundSummary } from './guessingEngine';
import type { ModeId } from './rules';

export type DailyStageStatus = 'pending' | 'playing' | 'won' | 'lost' | 'abandoned';

export type GuessMark = 'hit' | 'near' | 'miss';

export interface DailyStageRecord {
  readonly modeId: ModeId;
  readonly status: DailyStageStatus;
  readonly score: number;
  readonly attempts: number;
  readonly maxAttempts: number;
  readonly elapsedMs: number;
  readonly marks: readonly GuessMark[];
  readonly answerName: string | null;
}

export interface DailyRun {
  readonly day: string;
  readonly stages: readonly DailyStageRecord[];
}

const FINISHED: readonly DailyStageStatus[] = ['won', 'lost', 'abandoned'];

export function createDailyRun(day: string, modeIds: readonly ModeId[]): DailyRun {
  return {
    day,
    stages: modeIds.map((modeId) => ({
      modeId,
      status: 'pending',
      score: 0,
      attempts: 0,
      maxAttempts: 0,
      elapsedMs: 0,
      marks: [],
      answerName: null,
    })),
  };
}

export function isStageFinished(stage: DailyStageRecord): boolean {
  return FINISHED.includes(stage.status);
}

export function currentStageIndex(run: DailyRun): number | null {
  const index = run.stages.findIndex((stage) => !isStageFinished(stage));
  return index === -1 ? null : index;
}

export function isRunComplete(run: DailyRun): boolean {
  return currentStageIndex(run) === null;
}

export function totalScore(run: DailyRun): number {
  return run.stages.reduce((sum, stage) => sum + stage.score, 0);
}

export function markStagePlaying(run: DailyRun, index: number): DailyRun {
  return updateStage(run, index, (stage) => {
    if (stage.status !== 'pending') throw new Error(`A etapa ${index + 1} já foi iniciada hoje.`);
    return { ...stage, status: 'playing' };
  });
}

export function completeStage(run: DailyRun, index: number, summary: RoundSummary): DailyRun {
  return updateStage(run, index, (stage) => {
    if (stage.status !== 'playing') throw new Error(`A etapa ${index + 1} não está em andamento.`);
    if (stage.modeId !== summary.mode) throw new Error(`Resultado de outro modo enviado para a etapa ${index + 1}.`);
    return {
      ...stage,
      status: summary.won ? 'won' : 'lost',
      score: summary.score.total,
      attempts: summary.attempts,
      maxAttempts: summary.maxAttempts,
      elapsedMs: summary.elapsedMs,
      marks: summary.guesses.map(markOf),
      answerName: summary.question.answer.name,
    };
  });
}

export function abandonPlayingStages(run: DailyRun): DailyRun {
  return {
    ...run,
    stages: run.stages.map((stage) => (stage.status === 'playing' ? { ...stage, status: 'abandoned', score: 0 } : stage)),
  };
}

function markOf(guess: GuessRecord): GuessMark {
  if (guess.correct) return 'hit';
  return guess.partial ? 'near' : 'miss';
}

function updateStage(run: DailyRun, index: number, change: (stage: DailyStageRecord) => DailyStageRecord): DailyRun {
  const stage = run.stages[index];
  if (!stage) throw new Error(`Etapa ${index + 1} inexistente no desafio do dia.`);
  return { ...run, stages: run.stages.map((item, position) => (position === index ? change(item) : item)) };
}

const MARK_SQUARES: Readonly<Record<GuessMark, string>> = { hit: '🟩', near: '🟨', miss: '🟥' };

export interface DailyShareLine {
  readonly emoji: string;
  readonly stage: DailyStageRecord;
}

export function buildDailyShareText(run: DailyRun, lines: readonly DailyShareLine[], formatNumber: (value: number) => string): string {
  const rows = lines.map(({ emoji, stage }) => {
    const squares = stage.marks.map((mark) => MARK_SQUARES[mark]).join('') || '⬛';
    const outcome = stage.status === 'won' ? `${stage.attempts}/${stage.maxAttempts}` : 'X';
    return `${emoji} ${squares} ${outcome}`;
  });
  return ['Valorando · Desafio do dia', run.day, '', ...rows, '', `Total: ${formatNumber(totalScore(run))} pontos`].join('\n');
}
