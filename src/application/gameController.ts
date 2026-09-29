import { appendToHistory, selectQuestion } from '../domain/questionSelector';
import { GuessingGameEngine, type GameSnapshot, type GuessOutcome } from '../domain/guessingEngine';
import type { Hint, Question } from '../domain/question';
import type {
  ChallengeDefinition,
  ChallengeId,
  DifficultyId,
  DifficultyPreset,
  ModeDefinition,
  ModeId,
  ScoringRules,
} from '../domain/rules';
import { recordInBook, summarizeStats, type StatsBook, type StatsSummary } from '../domain/statistics';
import type { ModeCatalog } from '../modes/modeCatalog';
import type { HistoryByMode, PlayerSettings, Repositories } from '../infrastructure/repositories';

export interface GameControllerDeps {
  readonly catalog: ModeCatalog;
  readonly scoring: ScoringRules;
  readonly selection: { readonly avoidRatio: number; readonly historyLength: number };
  readonly repositories: Repositories;
  readonly assetUrl: (path: string) => string;
  readonly preload: (url: string) => Promise<void>;
}

type SnapshotListener = (snapshot: GameSnapshot) => void;

export interface FixedRound {
  readonly modeId: ModeId;
  readonly difficulty: DifficultyId;
  readonly question: Question;
}

interface PrefetchedQuestion {
  readonly modeId: ModeDefinition['id'];
  readonly question: Question;
}

export class GameController {
  #engine: GuessingGameEngine | null = null;
  #engineMode: ModeDefinition | null = null;
  #enginePreset: DifficultyPreset | null = null;
  #unsubscribe: (() => void) | null = null;
  #settings: PlayerSettings;
  #stats: StatsBook;
  #history: HistoryByMode;
  #next: PrefetchedQuestion | null = null;
  #fixedRound: FixedRound | null = null;
  readonly #failedIds = new Set<string>();
  readonly #listeners = new Set<SnapshotListener>();

  constructor(private readonly deps: GameControllerDeps) {
    this.#settings = deps.repositories.settings.load();
    this.#stats = deps.repositories.stats.load();
    this.#history = deps.repositories.history.load();
  }

  get catalog(): ModeCatalog {
    return this.deps.catalog;
  }

  get settings(): PlayerSettings {
    return this.#settings;
  }

  get mode(): ModeDefinition {
    return this.#engineMode ?? this.deps.catalog.mode(this.#settings.mode);
  }

  get challenge(): ChallengeDefinition {
    return this.deps.catalog.challengeOf(this.mode.id);
  }

  get preset(): DifficultyPreset {
    return this.#enginePreset ?? this.mode.difficulties[this.#settings.difficulty];
  }

  overallStats(): StatsSummary {
    return summarizeStats(this.#stats.overall);
  }

  challengeStats(id: ChallengeId): StatsSummary {
    return summarizeStats(this.#stats.byChallenge[id]);
  }

  updateSettings(settings: PlayerSettings): void {
    this.#settings = settings;
    this.deps.repositories.settings.save(settings);
  }

  onSnapshot(listener: SnapshotListener): () => void {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  }

  snapshot(): GameSnapshot | null {
    return this.#engine?.snapshot() ?? null;
  }

  elapsedMs(): number {
    return this.#engine?.elapsedMs() ?? 0;
  }

  async startRound(): Promise<void> {
    const mode = this.deps.catalog.mode(this.#settings.mode);
    const question = this.#takeNextQuestion(mode);
    this.#fixedRound = null;
    this.#replaceEngine(mode, this.#settings.difficulty);
    await this.#load(mode, question, true);
  }

  async startFixedRound(round: FixedRound): Promise<void> {
    const mode = this.deps.catalog.mode(round.modeId);
    this.#fixedRound = round;
    this.#replaceEngine(mode, round.difficulty);
    await this.#load(mode, round.question, false);
  }

  preloadQuestion(question: Question): void {
    this.deps.preload(this.deps.assetUrl(question.image)).catch((error: unknown) => {
      console.warn('Pré-carregamento de desafio falhou.', error);
    });
  }

  async retry(): Promise<void> {
    if (this.#engine?.status !== 'ERROR') return;
    if (this.#fixedRound) await this.startFixedRound(this.#fixedRound);
    else await this.startRound();
  }

  guess(input: string): GuessOutcome {
    const engine = this.#requireEngine();
    const outcome = engine.submitGuess(input);
    if (outcome.kind === 'correct' || outcome.kind === 'lost') this.#recordFinishedRound(engine, this.#fixedRound === null);
    return outcome;
  }

  requestHint(): Hint | null {
    return this.#requireEngine().requestHint();
  }

  showResult(): void {
    this.#requireEngine().showResult();
  }

  async #load(mode: ModeDefinition, question: Question, prefetchNext: boolean): Promise<void> {
    const engine = this.#requireEngine();
    engine.beginLoading(question);
    try {
      await this.deps.preload(this.deps.assetUrl(question.image));
    } catch (error) {
      console.error(error);
      if (prefetchNext) this.#failedIds.add(question.id);
      if (engine === this.#engine) engine.markFailed();
      return;
    }
    if (engine !== this.#engine) return;
    engine.markReady();
    if (prefetchNext) this.#prefetchNext(mode, question);
  }

  #replaceEngine(mode: ModeDefinition, difficulty: DifficultyId): void {
    this.#unsubscribe?.();
    this.#engineMode = mode;
    this.#enginePreset = mode.difficulties[difficulty];
    this.#engine = new GuessingGameEngine({ mode, preset: this.#enginePreset, scoring: this.deps.scoring });
    this.#unsubscribe = this.#engine.subscribe((snapshot) => this.#listeners.forEach((listener) => listener(snapshot)));
  }

  #takeNextQuestion(mode: ModeDefinition): Question {
    const prefetched = this.#next?.modeId === mode.id ? this.#next.question : null;
    this.#next = null;
    return prefetched ?? this.#pickQuestion(mode);
  }

  #pickQuestion(mode: ModeDefinition, excludeIds: readonly string[] = []): Question {
    return selectQuestion(mode.questions, {
      recentIds: this.#history[mode.id] ?? [],
      avoidRatio: this.deps.selection.avoidRatio,
      excludeIds: [...excludeIds, ...this.#failedIds],
    });
  }

  #prefetchNext(mode: ModeDefinition, current: Question): void {
    const question = this.#pickQuestion(mode, [current.id]);
    this.#next = { modeId: mode.id, question };
    this.preloadQuestion(question);
  }

  #recordFinishedRound(engine: GuessingGameEngine, tracksHistory: boolean): void {
    const summary = engine.snapshot().summary;
    if (!summary) return;
    this.#stats = recordInBook(this.#stats, summary);
    this.deps.repositories.stats.save(this.#stats);
    if (!tracksHistory) return;
    this.#history = {
      ...this.#history,
      [summary.mode]: appendToHistory(this.#history[summary.mode] ?? [], summary.question.id, this.deps.selection.historyLength),
    };
    this.deps.repositories.history.save(this.#history);
  }

  #requireEngine(): GuessingGameEngine {
    if (!this.#engine) throw new Error('Nenhuma rodada em andamento.');
    return this.#engine;
  }
}
