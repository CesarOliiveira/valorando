import type { Hint } from './question';
import type { HintPolicy } from './rules';

export interface HintPlan {
  readonly pinned: readonly Hint[];
  readonly deck: readonly Hint[];
}

export function planHints(hints: readonly Hint[], policy: HintPolicy): HintPlan {
  const visible = hints.filter((hint) => !policy.hidden.includes(hint.kind));
  return {
    pinned: visible.filter((hint) => policy.pinned.includes(hint.kind)),
    deck: visible.filter((hint) => !policy.pinned.includes(hint.kind)).slice(0, policy.max),
  };
}

export function autoHintsUnlocked(policy: HintPolicy, wrongGuesses: number): number {
  const automatic = policy.autoEvery > 0 ? Math.floor(wrongGuesses / policy.autoEvery) : 0;
  return policy.initial + automatic;
}
