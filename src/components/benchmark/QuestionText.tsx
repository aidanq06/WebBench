"use client";

import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import type { Components } from "react-markdown";

const components: Components = {
  pre({ children }) {
    return <>{children}</>;
  },
  code({ className, children, ...props }) {
    const match = /language-(\w+)/.exec(className ?? "");

    if (match) {
      return (
        <SyntaxHighlighter
          style={vscDarkPlus}
          language={match[1]}
          PreTag="div"
          customStyle={{
            margin: "0.5rem 0",
            borderRadius: 0,
            fontSize: "0.8rem",
            lineHeight: 1.5,
          }}
        >
          {String(children).replace(/\n$/, "")}
        </SyntaxHighlighter>
      );
    }

    return (
      <code
        className="rounded-sm bg-muted px-1 py-0.5 font-mono text-[0.85em]"
        {...props}
      >
        {children}
      </code>
    );
  },
};

const CHOICE_LABELS = ["A", "B", "C", "D"] as const;
type ChoiceLetter = typeof CHOICE_LABELS[number];

export function QuestionText({
  text,
  choices,
  highlightCorrect,
  highlightSelected,
  spotlight,
}: {
  text: string;
  choices?: readonly [string, string, string, string];
  highlightCorrect?: ChoiceLetter;
  highlightSelected?: ChoiceLetter;
  spotlight?: ChoiceLetter | null;
}) {
  const reveal = !!highlightCorrect;

  return (
    <span className="flex flex-col gap-[0.6em]">
      <span className="[&>p]:mb-[0.4em] [&>p:last-child]:mb-0">
        <ReactMarkdown
          remarkPlugins={[remarkMath]}
          rehypePlugins={[rehypeKatex]}
          components={components}
        >
          {text}
        </ReactMarkdown>
      </span>
      {choices && (
        <span className="flex flex-col gap-[0.3em] mt-[0.2em]">
          {choices.map((choice, i) => {
            const label = CHOICE_LABELS[i];
            const isCorrect = label === highlightCorrect;
            const isSelected = label === highlightSelected;
            const isWrong = isSelected && !isCorrect;
            const isSpotlit = !reveal && spotlight === label;
            const isDimmed = !reveal && spotlight != null && spotlight !== label;

            const baseClass = "flex items-center gap-[0.4em] rounded-sm px-[0.4em] py-[0.2em] text-[0.95em] leading-snug transition-all duration-300";
            const stateClass = isCorrect
              ? "bg-green-600/10 text-green-700 dark:text-green-400"
              : isWrong
                ? "bg-red-600/10 text-red-700 dark:text-red-400"
                : isSpotlit
                  ? "bg-foreground/[0.06] text-foreground"
                  : isDimmed
                    ? "text-muted-foreground opacity-40"
                    : "text-muted-foreground";

            return (
              <span key={label} className={`${baseClass} ${stateClass}`}>
                <span className="shrink-0 font-mono font-medium">{label}.</span>
                <span className="flex-1">{choice}</span>
              </span>
            );
          })}
        </span>
      )}
    </span>
  );
}
