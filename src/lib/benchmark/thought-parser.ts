export interface ThoughtSegment {
  id: string;
  type: "thought" | "answer";
  preview: string;    // first 80 chars, shown when collapsed
  full: string;       // full paragraph text
  streaming: boolean; // true for the last segment while still incoming
}

export function parseThoughts(text: string): ThoughtSegment[] {
  // Strip <think> tags — treat content inside as regular thoughts
  const cleaned = text.replace(/<\/?think>/gi, "").trim();
  if (!cleaned) return [];

  // Split on blank lines (paragraph breaks)
  const paragraphs = cleaned.split(/\n{2,}/).map(p => p.trim()).filter(Boolean);
  const isComplete = text.trimEnd().endsWith("\n");

  return paragraphs.map((p, i) => {
    const isAnswer = /ANSWER:\s*[ABCD]/i.test(p);
    const isLast = i === paragraphs.length - 1;
    return {
      id: `t-${i}`,
      type: isAnswer ? "answer" : "thought",
      preview: p.length > 80 ? p.slice(0, 80).trimEnd() + "…" : p,
      full: p,
      streaming: isLast && !isComplete,
    };
  });
}
