import {
  abandonPlayingStages,
  buildDailyShareText,
  completeStage,
  createDailyRun,
  currentStageIndex,
  isRunComplete,
  markStagePlaying,
  totalScore,
  type DailyRun,
} from '../domain/dailyRun';
import { localDayKey, msUntilNextLocalDay, seededRandom } from '../domain/dailySeed';
import type { RoundSummary } from '../domain/guessingEngine';
import type { Question } from '../domain/question';
import { selectQuestion } from '../domain/questionSelector';
import type { ChallengeDefinition, DifficultyId, ModeDefinition, ModeId } from '../domain/rules';
import type { ModeCatalog } from '../modes/modeCatalog';
import type { GameController } from './gameController';

export interface DailyChallengeDeps {
  readonly controller: GameController;
  readonly catalog: ModeCatalog;
  readonly modes: readonly ModeId[];
  readonly difficulty: DifficultyId;
  readonly repository: { load(): DailyRun | null; save(run: DailyRun): void };
  readonly now?: () => Date;
}

export interface DailyStageView {
  readonly index: number;
  readonly mode: ModeDefinition;
  readonly challenge: ChallengeDefinition;
  readonly record: DailyRun['stages'][number];
}

export type DailyStatus = 'available' | 'in-progress' | 'complete';

const numberFormat = new Intl.NumberFormat('pt-BR');

export class DailyChallenge {
  #run: DailyRun;

  constructor(private readonly deps: DailyChallengeDeps) {
    this.#run = this.#loadTodayRun();
  }

  get difficulty(): DifficultyId {
    return this.deps.difficulty;
  }

  refresh(): void {
    if (this.#run.day !== this.#today()) this.#run = this.#loadTodayRun();
  }

  status(): DailyStatus {
    this.refresh();
    if (isRunComplete(this.#run)) return 'complete';
    return this.#run.stages.some((stage) => stage.status !== 'pending') ? 'in-progress' : 'available';
  }

  day(): string {
    return this.#run.day;
  }

  stages(): DailyStageView[] {
    return this.#run.stages.map((record, index) => {
      const mode = this.deps.catalog.mode(record.modeId);
      return { index, mode, challenge: this.deps.catalog.challengeOf(mode.id), record };
    });
  }

  currentStage(): DailyStageView | null {
    const index = currentStageIndex(this.#run);
    return index === null ? null : this.stages()[index];
  }

  total(): number {
    return totalScore(this.#run);
  }

  msUntilNextDay(): number {
    return msUntilNextLocalDay(this.#now());
  }

  async startCurrentStage(): Promise<void> {
    this.refresh();
    const index = currentStageIndex(this.#run);
    if (index === null) throw new Error('O desafio de hoje já foi concluído. Volte amanhã.');
    const { modeId } = this.#run.stages[index];
    this.#save(markStagePlaying(this.#run, index));
    const nextStage = this.#run.stages[index + 1];
    await this.deps.controller.startFixedRound({ modeId, difficulty: this.deps.difficulty, question: this.#questionFor(modeId) });
    if (nextStage) this.deps.controller.preloadQuestion(this.#questionFor(nextStage.modeId));
  }

  recordStageResult(summary: RoundSummary): void {
    const index = this.#run.stages.findIndex((stage) => stage.status === 'playing');
    if (index === -1) return;
    this.#save(completeStage(this.#run, index, summary));
  }

  abandonActiveStage(): void {
    if (this.#run.stages.some((stage) => stage.status === 'playing')) this.#save(abandonPlayingStages(this.#run));
  }

  shareText(): string {
    const lines = this.stages().map(({ challenge, record }) => ({ emoji: challenge.shareEmoji, stage: record }));
    return buildDailyShareText(this.#run, lines, (value) => numberFormat.format(value));
  }

  #questionFor(modeId: ModeId): Question {
    const mode = this.deps.catalog.mode(modeId);
    return selectQuestion(mode.questions, {
      recentIds: [],
      avoidRatio: 0,
      random: seededRandom(`${this.#run.day}:${modeId}`),
    });
  }

  #loadTodayRun(): DailyRun {
    const today = this.#today();
    const stored = this.deps.repository.load();
    const sameShape =
      stored?.day === today &&
      stored.stages.length === this.deps.modes.length &&
      stored.stages.every((stage, index) => stage.modeId === this.deps.modes[index]);
    const run = sameShape ? abandonPlayingStages(stored) : createDailyRun(today, this.deps.modes);
    this.deps.repository.save(run);
    return run;
  }

  #save(run: DailyRun): void {
    this.#run = run;
    this.deps.repository.save(run);
  }

  #today(): string {
    return localDayKey(this.#now());
  }

  #now(): Date {
    return this.deps.now?.() ?? new Date();
  }
}
