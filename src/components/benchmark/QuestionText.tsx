"use client";

import katex from "katex";

function renderInline(latex: string): string {
  try {
    return katex.renderToString(latex, { throwOnError: false, displayMode: false });
  } catch {
    return latex;
  }
}

function renderDisplay(latex: string): string {
  try {
    return katex.renderToString(latex, { throwOnError: false, displayMode: true });
  } catch {
    return latex;
  }
}

interface Segment {
  type: "text" | "inline" | "display";
  content: string;
}

function parseSegments(text: string): Segment[] {
  const segments: Segment[] = [];
  // Match $$...$$ first, then $...$
  const re = /\$\$([^$]+)\$\$|\$([^$\n]+)\$/g;
  let last = 0;
  let match: RegExpExecArray | null;

  while ((match = re.exec(text)) !== null) {
    if (match.index > last) {
      segments.push({ type: "text", content: text.slice(last, match.index) });
    }
    if (match[1] !== undefined) {
      segments.push({ type: "display", content: match[1] });
    } else {
      segments.push({ type: "inline", content: match[2] });
    }
    last = match.index + match[0].length;
  }

  if (last < text.length) {
    segments.push({ type: "text", content: text.slice(last) });
  }

  return segments;
}

export function QuestionText({ text }: { text: string }) {
  const segments = parseSegments(text);

  return (
    <span>
      {segments.map((seg, i) => {
        if (seg.type === "display") {
          return (
            <span
              key={i}
              className="my-2 block"
              dangerouslySetInnerHTML={{ __html: renderDisplay(seg.content) }}
            />
          );
        }
        if (seg.type === "inline") {
          return (
            <span
              key={i}
              dangerouslySetInnerHTML={{ __html: renderInline(seg.content) }}
            />
          );
        }
        // plain text — preserve newlines
        return (
          <span key={i} className="whitespace-pre-wrap">
            {seg.content}
          </span>
        );
      })}
    </span>
  );
}
