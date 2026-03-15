"use client";

import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import type { Components } from "react-markdown";

const components: Components = {
  // fenced code blocks — delegate children so <pre> doesn't double-wrap
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

    // inline code or fenced block without language tag
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

export function QuestionText({
  text,
  choices,
  highlightCorrect,
  highlightSelected,
}: {
  text: string;
  choices?: [string, string, string, string];
  highlightCorrect?: "A" | "B" | "C" | "D";
  highlightSelected?: "A" | "B" | "C" | "D";
}) {
  return (
    <span className="flex flex-col gap-3">
      <span className="[&>p]:mb-2 [&>p:last-child]:mb-0">
        <ReactMarkdown
          remarkPlugins={[remarkMath]}
          rehypePlugins={[rehypeKatex]}
          components={components}
        >
          {text}
        </ReactMarkdown>
      </span>
      {choices && (
        <span className="flex flex-col gap-1.5 mt-1">
          {choices.map((choice, i) => {
            const label = CHOICE_LABELS[i];
            const isCorrect = label === highlightCorrect;
            const isSelected = label === highlightSelected;
            const isWrong = isSelected && !isCorrect;
            return (
              <span
                key={label}
                className={`flex gap-2 rounded-sm px-2 py-1 text-sm leading-snug ${
                  isCorrect
                    ? "bg-green-600/10 text-green-700 dark:text-green-400"
                    : isWrong
                    ? "bg-red-600/10 text-red-700 dark:text-red-400"
                    : "text-muted-foreground"
                }`}
              >
                <span className="shrink-0 font-mono font-medium">{label}.</span>
                <span>{choice}</span>
              </span>
            );
          })}
        </span>
      )}
    </span>
  );
}
