"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { QUESTIONS } from "@/lib/benchmark/questions";
import { QuestionText } from "@/components/benchmark/QuestionText";
import type { Subject, Difficulty } from "@/types/agent";

const SUBJECTS: (Subject | "all")[] = ["all", "math", "logic", "coding", "reasoning"];
const DIFFICULTIES: (Difficulty | "all")[] = ["all", "easy", "medium", "hard"];

const SUBJECT_COLORS: Record<Subject, string> = {
  math: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  logic: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  coding: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  reasoning: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
};

const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  easy: "bg-green-500/10 text-green-600 dark:text-green-400",
  medium: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  hard: "bg-red-500/10 text-red-600 dark:text-red-400",
};

function plainPreview(text: string): string {
  return text
    .replace(/\$\$[^$]+\$\$/g, "…")
    .replace(/\$[^$\n]+\$/g, (m) =>
      m.slice(1, -1).replace(/\\[a-zA-Z]+\*?/g, "").replace(/[{}^_]/g, "")
    )
    .replace(/```[\s\S]*?```/g, "[code]")
    .replace(/`[^`]+`/g, (m) => m.slice(1, -1))
    .replace(/\n/g, " ")
    .trim()
    .slice(0, 120);
}

export function TaskPreviewGrid() {
  const [activeSubject, setActiveSubject] = useState<Subject | "all">("all");
  const [activeDifficulty, setActiveDifficulty] = useState<Difficulty | "all">("all");
  const [openId, setOpenId] = useState<string | null>(null);

  const filtered = QUESTIONS.filter((q) => {
    const matchSubject = activeSubject === "all" || q.subject === activeSubject;
    const matchDiff = activeDifficulty === "all" || q.difficulty === activeDifficulty;
    return matchSubject && matchDiff;
  });

  return (
    <section className="border-t px-6 py-12">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        {/* header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium tracking-tight">question set</h2>
          <span className="text-xs text-muted-foreground">
            {QUESTIONS.length} questions · 4 subjects
          </span>
        </div>

        {/* filter pills */}
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            {SUBJECTS.map((s) => (
              <button
                key={s}
                onClick={() => { setActiveSubject(s); setOpenId(null); }}
                className={`px-3 py-1 text-xs transition-colors ${
                  activeSubject === s
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {DIFFICULTIES.map((d) => (
              <button
                key={d}
                onClick={() => { setActiveDifficulty(d); setOpenId(null); }}
                className={`px-3 py-1 text-xs transition-colors ${
                  activeDifficulty === d
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* question list */}
        <div className="flex flex-col border">
          {filtered.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              no questions match these filters
            </div>
          ) : (
            filtered.map((q) => {
              const isOpen = openId === q.id;
              return (
                <div key={q.id} className="border-b last:border-b-0">
                  <button
                    className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-accent/20"
                    onClick={() => setOpenId(isOpen ? null : q.id)}
                  >
                    <span className={`shrink-0 rounded-sm px-1.5 py-0.5 text-[10px] font-medium ${DIFFICULTY_COLORS[q.difficulty]}`}>
                      {q.difficulty}
                    </span>
                    <span className={`shrink-0 rounded-sm px-1.5 py-0.5 text-[10px] font-medium ${SUBJECT_COLORS[q.subject]}`}>
                      {q.subject}
                    </span>
                    <span className="flex-1 truncate text-xs text-muted-foreground">
                      {plainPreview(q.text)}
                    </span>
                    <motion.span
                      animate={{ rotate: isOpen ? 90 : 0 }}
                      transition={{ duration: 0.2 }}
                      className="shrink-0 text-muted-foreground/40"
                    >
                      <ChevronRight className="h-3.5 w-3.5" />
                    </motion.span>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        key="content"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <div className="ml-4 flex flex-col gap-3 border-l-2 border-muted-foreground/20 px-4 py-4">
                          <div className="text-sm leading-relaxed text-foreground/70">
                            <QuestionText text={q.text} />
                          </div>
                          <div className="text-xs text-muted-foreground">
                            expected:{" "}
                            <span className="font-mono text-foreground/60">
                              {q.expectedAnswer}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}
