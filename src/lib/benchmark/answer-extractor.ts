export type ExtractSource = "explicit" | "affirmation" | "choice-text" | "voting" | "none";
export type Letter = "A" | "B" | "C" | "D";
export interface Extraction {
  letter: "" | Letter;
  source: ExtractSource;
}

const LETTERS: Letter[] = ["A", "B", "C", "D"];

const STOP = new Set([
  "the", "a", "an", "is", "of", "to", "in", "and", "or", "for", "that", "this",
  "with", "as", "by", "be", "are", "it", "on", "at", "from", "but", "not",
]);

function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP.has(w));
}

export function extractAnswer(text: string, choices: readonly [string, string, string, string]): Extraction {
  const t = text.replace(/<\/?think>/gi, "").trim();
  if (!t) return { letter: "", source: "none" };

  // Tier 1: Explicit format — ANSWER: X, **X**, \boxed{X}.
  const explicit =
    t.match(/ANSWER\s*[:=]\s*\(?\s*([ABCD])\b/i) ||
    t.match(/\\boxed\{\s*\(?\s*([ABCD])\s*\)?\s*\}/i) ||
    t.match(/\*\*\s*([ABCD])\s*\*\*\s*\.?\s*$/m);
  if (explicit) {
    return { letter: explicit[1].toUpperCase() as Letter, source: "explicit" };
  }

  // Tier 2: Affirmation patterns. Use the LAST match (final commitment wins
  // over earlier deliberation).
  const affirmRe = /(?:the\s+)?(?:correct\s+|best\s+|final\s+|right\s+)?(?:answer|choice|option|response)\s+(?:is|would\s+be|should\s+be|must\s+be|=)\s*\(?\s*([ABCD])\b|(?:i\s+(?:choose|pick|select|go\s+with|believe|think|say)|therefore|hence|thus|so)[^A-D\n]{0,30}\(?\s*([ABCD])\b|^\s*\(?([ABCD])\)?\s*[.):]\s*$/gim;
  const affirm = [...t.matchAll(affirmRe)];
  if (affirm.length > 0) {
    const last = affirm[affirm.length - 1];
    const letter = (last[1] || last[2] || last[3]).toUpperCase();
    return { letter: letter as Letter, source: "affirmation" };
  }

  // Tier 3: Choice-text matching. Look at the final two paragraphs and see if
  // the model quoted/restated one of the choices distinctly more than the others.
  const tail = t.split(/\n\s*\n/).slice(-2).join(" ").toLowerCase();
  const scores = choices.map((c) => {
    const ts = tokenize(c);
    if (ts.length === 0) return 0;
    const hits = ts.filter((w) => tail.includes(w)).length;
    return hits / ts.length;
  });
  const top = Math.max(...scores);
  const topIdx = scores.indexOf(top);
  const second = Math.max(...scores.filter((_, i) => i !== topIdx));
  if (top >= 0.6 && top - second >= 0.2) {
    return { letter: LETTERS[topIdx], source: "choice-text" };
  }

  // Tier 4: Position-weighted voting on letter mentions. Later mentions weigh
  // more (the model usually commits at the end). Requires a real margin.
  const mentions = [...t.matchAll(/\b([ABCD])\b/g)];
  if (mentions.length > 0) {
    const weights: Record<Letter, number> = { A: 0, B: 0, C: 0, D: 0 };
    for (const m of mentions) {
      const pos = (m.index ?? 0) / Math.max(1, t.length);
      weights[m[1] as Letter] += Math.pow(pos + 0.1, 2);
    }
    const ranked = (Object.entries(weights) as Array<[Letter, number]>).sort((a, b) => b[1] - a[1]);
    if (ranked[0][1] > 0 && ranked[0][1] >= 1.5 * (ranked[1][1] || 0.01)) {
      return { letter: ranked[0][0], source: "voting" };
    }
  }

  return { letter: "", source: "none" };
}

export const EXTRACT_SOURCE_LABEL: Record<ExtractSource, string> = {
  "explicit":    "explicit format",
  "affirmation": "phrased commitment",
  "choice-text": "quoted the choice",
  "voting":      "weighted letter vote",
  "none":        "no answer found",
};
