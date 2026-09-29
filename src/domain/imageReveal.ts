import type { DifficultyPreset, FocusAnchor, FocusAnchors, FocusPoint, ImageTreatment, RevealLevel } from './rules';

export interface ImageVisualState extends RevealLevel {
  readonly silhouette: number;
  readonly focus: FocusPoint;
  readonly anchor: FocusAnchor;
  readonly level: number;
}

export interface FocusChoice {
  readonly anchor: FocusAnchor;
  readonly point: FocusPoint;
}

const FULL_REVEAL: RevealLevel = { pixels: 0, blur: 0, reveal: 100, brightness: 1, contrast: 1, saturation: 1 };
const SILHOUETTE_BLUR_FACTOR = 0.25;
const SILHOUETTE_PIXEL_FACTOR = 2;
const FOCUS_JITTER = 4;

export function pickFocus(anchors: FocusAnchors, random: () => number): FocusChoice {
  const names = Object.keys(anchors) as FocusAnchor[];
  const anchor = names[Math.min(names.length - 1, Math.floor(random() * names.length))];
  const jitter = () => (random() * 2 - 1) * FOCUS_JITTER;
  const base = anchors[anchor];
  return { anchor, point: { x: clampPercent(base.x + jitter()), y: clampPercent(base.y + jitter()) } };
}

function clampPercent(value: number): number {
  return Math.min(100, Math.max(0, value));
}

export function revealLevelIndex(preset: DifficultyPreset, wrongGuesses: number): number {
  return Math.min(wrongGuesses, preset.revealLevels.length - 1);
}

export function computeImageState(
  preset: DifficultyPreset,
  treatment: ImageTreatment,
  wrongGuesses: number,
  finished: boolean,
  focus: FocusChoice,
): ImageVisualState {
  const level = revealLevelIndex(preset, wrongGuesses);
  const placement = { focus: focus.point, anchor: focus.anchor, level };
  if (finished) return { ...FULL_REVEAL, silhouette: 0, ...placement };
  const step = preset.revealLevels[level];
  if (treatment === 'silhouette') {
    return {
      ...FULL_REVEAL,
      pixels: step.pixels * SILHOUETTE_PIXEL_FACTOR,
      blur: Math.round(step.blur * SILHOUETTE_BLUR_FACTOR),
      silhouette: 1,
      ...placement,
    };
  }
  return { ...step, silhouette: 0, ...placement };
}
