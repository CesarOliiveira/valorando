import type { AnswerOption, Question } from './question';

export type DifficultyId = 'easy' | 'normal' | 'hard' | 'insane';

export type ChallengeId = 'agents' | 'weapons' | 'skins' | 'abilities';

export type ModeId =
  | 'agent-classic'
  | 'agent-silhouette'
  | 'weapon'
  | 'skin'
  | 'skin-collection'
  | 'ability'
  | 'ability-agent'
  | 'ultimate';

export interface RevealLevel {
  readonly pixels: number;
  readonly blur: number;
  readonly reveal: number;
  readonly brightness: number;
  readonly contrast: number;
  readonly saturation: number;
}

export interface HintPolicy {
  readonly initial: number;
  readonly autoEvery: number;
  readonly max: number;
  readonly pinned: readonly string[];
  readonly hidden: readonly string[];
}

export interface DifficultyPreset {
  readonly id: DifficultyId;
  readonly label: string;
  readonly summary: string;
  readonly maxAttempts: number;
  readonly scoreMultiplier: number;
  readonly revealLevels: readonly RevealLevel[];
  readonly hints: HintPolicy;
}

export interface ScoringRules {
  readonly base: number;
  readonly wrongGuessPenalty: number;
  readonly hintPenalty: number;
  readonly revealPenaltyPerLevel: number;
  readonly time: {
    readonly graceSeconds: number;
    readonly penaltyPerSecond: number;
    readonly accelerationSeconds: number;
    readonly maxPenalty: number;
  };
  readonly minimum: number;
}

export type AnswerType = 'agent' | 'weapon' | 'skin' | 'collection' | 'ability';

export type ImageTreatment = 'progressive-reveal' | 'silhouette';

export type ImageFit = 'portrait' | 'wide' | 'icon';

export type FocusAnchor = 'top' | 'bottom' | 'left' | 'right' | 'center';

export interface FocusPoint {
  readonly x: number;
  readonly y: number;
}

export type FocusAnchors = Readonly<Record<FocusAnchor, FocusPoint>>;

export interface ModeCopy {
  readonly title: string;
  readonly prompt: string;
  readonly placeholder: string;
  readonly answerLabel: string;
}

export interface ModePresentation {
  readonly treatment: ImageTreatment;
  readonly fit: ImageFit;
  readonly focus: FocusAnchors;
}

export interface ModeDefinition {
  readonly id: ModeId;
  readonly challenge: ChallengeId;
  readonly label: string;
  readonly summary: string;
  readonly copy: ModeCopy;
  readonly presentation: ModePresentation;
  readonly difficulties: Readonly<Record<DifficultyId, DifficultyPreset>>;
  readonly answerType: AnswerType;
  readonly questions: readonly Question[];
  readonly answers: readonly AnswerOption[];
}

export interface ChallengeDefinition {
  readonly id: ChallengeId;
  readonly label: string;
  readonly summary: string;
  readonly shareLabel: string;
  readonly shareEmoji: string;
  readonly intrinsicDifficulty: 1 | 2 | 3;
  readonly modes: readonly ModeDefinition[];
}
