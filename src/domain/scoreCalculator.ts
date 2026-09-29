import type { ScoringRules } from './rules';

export interface ScoreInput {
  readonly won: boolean;
  readonly wrongGuesses: number;
  readonly hintsUsed: number;
  readonly revealLevel: number;
  readonly elapsedMs: number;
  readonly multiplier: number;
}

export interface ScoreBreakdown {
  readonly base: number;
  readonly wrongGuesses: number;
  readonly hints: number;
  readonly reveal: number;
  readonly time: number;
  readonly multiplier: number;
  readonly total: number;
}

export function timePenalty(elapsedMs: number, rules: ScoringRules['time']): number {
  const overtime = Math.max(0, elapsedMs / 1000 - rules.graceSeconds);
  const progressive = rules.penaltyPerSecond * overtime * (1 + overtime / rules.accelerationSeconds);
  return Math.min(rules.maxPenalty, Math.round(progressive));
}

export function calculateScore(input: ScoreInput, rules: ScoringRules): ScoreBreakdown {
  const penalties = {
    wrongGuesses: input.wrongGuesses * rules.wrongGuessPenalty,
    hints: input.hintsUsed * rules.hintPenalty,
    reveal: input.revealLevel * rules.revealPenaltyPerLevel,
    time: timePenalty(input.elapsedMs, rules.time),
  };
  const raw = rules.base - penalties.wrongGuesses - penalties.hints - penalties.reveal - penalties.time;
  const total = input.won ? Math.max(rules.minimum, Math.round(raw * input.multiplier)) : rules.minimum;
  return { base: rules.base, ...penalties, multiplier: input.multiplier, total };
}
