import { DEFAULT_DIFFICULTY, DEFAULT_MODE, DIFFICULTY_ORDER, MODE_BALANCE } from '../config/gameConfig';
import type { DifficultyId, ModeId } from '../domain/rules';
import type { DailyRun, DailyStageRecord } from '../domain/dailyRun';
import { EMPTY_BOOK, EMPTY_STATS, type PlayerStats, type StatsBook } from '../domain/statistics';
import type { KeyValueStore } from './localStore';

export interface PlayerSettings {
  readonly difficulty: DifficultyId;
  readonly mode: ModeId;
}

export type HistoryByMode = Readonly<Partial<Record<ModeId, readonly string[]>>>;

const DEFAULT_SETTINGS: PlayerSettings = { difficulty: DEFAULT_DIFFICULTY, mode: DEFAULT_MODE };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isStats = (value: unknown): value is PlayerStats =>
  isRecord(value) && Object.keys(EMPTY_STATS).every((key) => typeof value[key] === 'number');

const isStatsBook = (value: unknown): value is StatsBook =>
  isRecord(value) && isStats(value.overall) && isRecord(value.byChallenge) && Object.values(value.byChallenge).every(isStats);

const isModeId = (value: unknown): value is ModeId => typeof value === 'string' && value in MODE_BALANCE;

const isDifficultyId = (value: unknown): value is DifficultyId =>
  typeof value === 'string' && (DIFFICULTY_ORDER as readonly string[]).includes(value);

const isHistory = (value: unknown): value is HistoryByMode =>
  isRecord(value) &&
  Object.entries(value).every(
    ([mode, ids]) => isModeId(mode) && Array.isArray(ids) && ids.every((id) => typeof id === 'string'),
  );

const STAGE_STATUSES = ['pending', 'playing', 'won', 'lost', 'abandoned'];
const GUESS_MARKS = ['hit', 'near', 'miss'];

const isDailyStage = (value: unknown): value is DailyStageRecord =>
  isRecord(value) &&
  isModeId(value.modeId) &&
  STAGE_STATUSES.includes(value.status as string) &&
  ['score', 'attempts', 'maxAttempts', 'elapsedMs'].every((key) => typeof value[key] === 'number') &&
  Array.isArray(value.marks) &&
  value.marks.every((mark) => GUESS_MARKS.includes(mark as string)) &&
  (value.answerName === null || typeof value.answerName === 'string');

const isDailyRun = (value: unknown): value is DailyRun =>
  isRecord(value) && typeof value.day === 'string' && Array.isArray(value.stages) && value.stages.every(isDailyStage);

function loadSettings(store: KeyValueStore): PlayerSettings {
  const stored = store.read('settings', null, isRecord);
  if (!stored) return DEFAULT_SETTINGS;
  return {
    mode: isModeId(stored.mode) ? stored.mode : DEFAULT_SETTINGS.mode,
    difficulty: isDifficultyId(stored.difficulty) ? stored.difficulty : DEFAULT_SETTINGS.difficulty,
  };
}

export function createRepositories(store: KeyValueStore) {
  return {
    stats: {
      load: (): StatsBook => store.read('stats-book', EMPTY_BOOK, isStatsBook),
      save: (book: StatsBook) => store.write('stats-book', book),
    },
    settings: {
      load: () => loadSettings(store),
      save: (settings: PlayerSettings) => store.write('settings', settings),
    },
    daily: {
      load: (): DailyRun | null => store.read('daily-run', null, isDailyRun),
      save: (run: DailyRun) => store.write('daily-run', run),
    },
    history: {
      load: (): HistoryByMode => store.read('history-by-mode', {}, isHistory),
      save: (history: HistoryByMode) => store.write('history-by-mode', history),
    },
  };
}

export type Repositories = ReturnType<typeof createRepositories>;
