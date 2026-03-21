// ── Single source of truth for all scoring constants ──────────────────────────
// To change the formula in the future, edit only this file.

export const SCORING = {
  weights: { easy: 1, medium: 2, hard: 4 }, // geometric: each level 2× previous
  scale: 1000,                               // max possible score
  minCompletionRatio: 0.5,                   // must complete ≥50% of intended count to submit
} as const;
