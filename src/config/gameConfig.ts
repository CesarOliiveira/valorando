import type {
  DifficultyId,
  DifficultyPreset,
  HintPolicy,
  ModeId,
  RevealLevel,
  ScoringRules,
} from '../domain/rules';

type RevealCurve = Readonly<Record<DifficultyId, readonly RevealLevel[]>>;
type HintTuning = Partial<Record<DifficultyId, Partial<Pick<HintPolicy, 'pinned' | 'hidden'>>>>;
type LevelTuple = readonly [
  pixels: number,
  blur: number,
  reveal: number,
  brightness?: number,
  contrast?: number,
  saturation?: number,
];

interface DifficultyBase {
  readonly label: string;
  readonly summary: string;
  readonly maxAttempts: number;
  readonly scoreMultiplier: number;
  readonly hints: Omit<HintPolicy, 'pinned' | 'hidden'>;
}

const levels = (...tuples: readonly LevelTuple[]): RevealLevel[] =>
  tuples.map(([pixels, blur, reveal, brightness = 1, contrast = 1, saturation = 1]) => ({
    pixels,
    blur,
    reveal,
    brightness,
    contrast,
    saturation,
  }));

const SKIN_MAX_BLUR_PX = 4;
const skinBlur = (percent: number) => Math.round((SKIN_MAX_BLUR_PX * percent) / 100);

export const DIFFICULTY_ORDER: readonly DifficultyId[] = ['easy', 'normal', 'hard', 'insane'];

const DIFFICULTY_BASE: Readonly<Record<DifficultyId, DifficultyBase>> = {
  easy: {
    label: 'Fácil',
    summary: 'Pixels finos, muitas pistas e 8 tentativas.',
    maxAttempts: 8,
    scoreMultiplier: 0.8,
    hints: { initial: 1, autoEvery: 1, max: 9 },
  },
  normal: {
    label: 'Normal',
    summary: 'Pixels médios, pistas progressivas e 6 tentativas.',
    maxAttempts: 6,
    scoreMultiplier: 1,
    hints: { initial: 0, autoEvery: 1, max: 6 },
  },
  hard: {
    label: 'Difícil',
    summary: 'Pixels grossos, poucas pistas e 5 tentativas.',
    maxAttempts: 5,
    scoreMultiplier: 1.25,
    hints: { initial: 0, autoEvery: 2, max: 3 },
  },
  insane: {
    label: 'Insano',
    summary: 'Blocos enormes, sem pistas automáticas e 3 tentativas.',
    maxAttempts: 3,
    scoreMultiplier: 1.6,
    hints: { initial: 0, autoEvery: 0, max: 2 },
  },
};

export const REVEAL_CURVES = {
  portrait: {
    easy: levels([40, 2, 40, 0.8, 0.9], [56, 1, 55, 0.85, 0.92], [80, 1, 70, 0.9, 0.95], [120, 0, 85, 0.95], [0, 0, 100]),
    normal: levels(
      [12, 2, 15, 0.55, 0.7],
      [18, 2, 30, 0.65, 0.78],
      [26, 1, 45, 0.75, 0.85],
      [38, 1, 60, 0.85, 0.9],
      [60, 0, 80, 0.95, 0.95],
      [0, 0, 100],
    ),
    hard: levels(
      [8, 3, 12, 0.5, 0.6],
      [11, 2, 20, 0.55, 0.66],
      [15, 2, 32, 0.62, 0.74],
      [21, 1, 48, 0.72, 0.82],
      [30, 1, 68, 0.85, 0.9],
    ),
    insane: levels([6, 3, 12, 0.55, 0.6], [8, 3, 20, 0.58, 0.64], [11, 2, 30, 0.62, 0.7]),
  },
  wide: {
    easy: levels([48, 1, 45, 0.85], [64, 1, 60, 0.9], [90, 0, 75, 0.95], [130, 0, 90], [0, 0, 100]),
    normal: levels(
      [16, 1, 25, 0.6, 0.75],
      [22, 1, 40, 0.7, 0.8],
      [30, 1, 55, 0.8, 0.88],
      [42, 1, 70, 0.9, 0.94],
      [64, 0, 85, 0.95],
      [0, 0, 100],
    ),
    hard: levels(
      [10, 2, 15, 0.55, 0.65],
      [14, 1, 25, 0.6, 0.72],
      [19, 1, 40, 0.7, 0.8],
      [26, 1, 55, 0.8, 0.88],
      [36, 1, 72, 0.9, 0.94],
    ),
    insane: levels([7, 2, 12, 0.55, 0.6], [9, 2, 20, 0.58, 0.64], [12, 1, 32, 0.62, 0.7]),
  },
  skin: {
    easy: levels(
      [30, skinBlur(60), 35, 0.8, 0.9, 0.4],
      [44, skinBlur(40), 50, 0.85, 0.92, 0.6],
      [64, skinBlur(25), 70, 0.9, 0.95, 0.8],
      [96, skinBlur(10), 85, 0.95, 1, 0.9],
      [0, 0, 100],
    ),
    normal: levels(
      [10, skinBlur(95), 10, 0.6, 0.7, 0],
      [14, skinBlur(75), 25, 0.68, 0.76, 0.2],
      [20, skinBlur(55), 40, 0.76, 0.82, 0.45],
      [30, skinBlur(35), 60, 0.84, 0.88, 0.7],
      [48, skinBlur(15), 80, 0.92, 0.94, 0.9],
      [0, 0, 100],
    ),
    hard: levels(
      [7, skinBlur(100), 8, 0.55, 0.65, 0],
      [9, skinBlur(85), 15, 0.6, 0.7, 0],
      [13, skinBlur(65), 28, 0.68, 0.76, 0.25],
      [18, skinBlur(45), 45, 0.76, 0.84, 0.5],
      [26, skinBlur(25), 65, 0.86, 0.9, 0.75],
    ),
    insane: levels(
      [5, skinBlur(100), 10, 0.55, 0.62, 0],
      [7, skinBlur(90), 16, 0.58, 0.66, 0],
      [9, skinBlur(75), 26, 0.62, 0.7, 0.2],
    ),
  },
  icon: {
    easy: levels([24, 1, 40, 0.85], [32, 1, 55, 0.9], [48, 0, 70, 0.95], [64, 0, 85], [0, 0, 100]),
    normal: levels(
      [8, 2, 20, 0.6, 0.75],
      [11, 1, 32, 0.7, 0.8],
      [15, 1, 48, 0.8, 0.86],
      [20, 1, 62, 0.88, 0.92],
      [32, 0, 80, 0.95],
      [0, 0, 100],
    ),
    hard: levels(
      [6, 2, 15, 0.55, 0.65],
      [8, 2, 24, 0.6, 0.7],
      [10, 1, 36, 0.68, 0.78],
      [13, 1, 52, 0.78, 0.86],
      [18, 1, 70, 0.88, 0.92],
    ),
    insane: levels([5, 2, 12, 0.55, 0.62], [6, 2, 20, 0.58, 0.66], [8, 2, 30, 0.62, 0.72]),
  },
} satisfies Record<string, RevealCurve>;

export type RevealCurveId = keyof typeof REVEAL_CURVES;

export interface ModeBalance {
  readonly curve: RevealCurveId;
  readonly hints: HintTuning;
}

const HIDE_AGENT_INFO = { hidden: ['agent', 'role', 'slot'] } as const;

export const MODE_BALANCE: Readonly<Record<ModeId, ModeBalance>> = {
  'agent-classic': { curve: 'portrait', hints: {} },
  'agent-silhouette': { curve: 'portrait', hints: {} },
  weapon: {
    curve: 'wide',
    hints: { easy: { pinned: ['category'] }, hard: { hidden: ['category'] }, insane: { hidden: ['category'] } },
  },
  skin: {
    curve: 'skin',
    hints: { easy: { pinned: ['weapon'] }, hard: { hidden: ['weapon'] }, insane: { hidden: ['weapon'] } },
  },
  'skin-collection': {
    curve: 'skin',
    hints: { easy: { pinned: ['weapon'] }, hard: { hidden: ['weapon'] }, insane: { hidden: ['weapon'] } },
  },
  ability: {
    curve: 'icon',
    hints: { easy: { pinned: ['type', 'slot', 'role'] }, hard: HIDE_AGENT_INFO, insane: HIDE_AGENT_INFO },
  },
  'ability-agent': {
    curve: 'icon',
    hints: { easy: { pinned: ['type', 'slot'] }, hard: { hidden: ['role', 'slot'] }, insane: { hidden: ['role', 'slot'] } },
  },
  ultimate: {
    curve: 'icon',
    hints: { easy: { pinned: ['role'] }, hard: { hidden: ['role'] }, insane: { hidden: ['role'] } },
  },
};

export function difficultiesFor(modeId: ModeId): Record<DifficultyId, DifficultyPreset> {
  const balance = MODE_BALANCE[modeId];
  const curve: RevealCurve = REVEAL_CURVES[balance.curve];
  return Object.fromEntries(
    DIFFICULTY_ORDER.map((id) => {
      const base = DIFFICULTY_BASE[id];
      const tuning = balance.hints[id] ?? {};
      const preset: DifficultyPreset = {
        id,
        label: base.label,
        summary: base.summary,
        maxAttempts: base.maxAttempts,
        scoreMultiplier: base.scoreMultiplier,
        revealLevels: curve[id],
        hints: { ...base.hints, pinned: tuning.pinned ?? [], hidden: tuning.hidden ?? [] },
      };
      return [id, preset];
    }),
  ) as Record<DifficultyId, DifficultyPreset>;
}

export const DIFFICULTY_LABELS: Readonly<Record<DifficultyId, Pick<DifficultyBase, 'label' | 'summary' | 'maxAttempts'>>> =
  DIFFICULTY_BASE;

export const DEFAULT_DIFFICULTY: DifficultyId = 'normal';

export const DEFAULT_MODE: ModeId = 'agent-classic';

export const SCORING: ScoringRules = {
  base: 1000,
  wrongGuessPenalty: 100,
  hintPenalty: 50,
  revealPenaltyPerLevel: 20,
  time: {
    graceSeconds: 10,
    penaltyPerSecond: 3,
    accelerationSeconds: 60,
    maxPenalty: 300,
  },
  minimum: 0,
};

export const DAILY_CHALLENGE: { readonly modes: readonly ModeId[]; readonly difficulty: DifficultyId } = {
  modes: ['agent-classic', 'weapon', 'skin', 'ability'],
  difficulty: 'normal',
};

export const SELECTION = {
  avoidRatio: 0.6,
  historyLength: 60,
};

const ACCENT = '#5CE1E6';

export const THEME = {
  accent: ACCENT,
  confetti: ['#35D07F', ACCENT, '#F5F5F5'],
};
