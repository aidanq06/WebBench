export const SCORING = {
  minCompletionRatio: 0.5, // must complete ≥50% of intended count to submit
  ciZ: 1.96,               // z-score for 95% confidence intervals (Wilson interval)
} as const;
