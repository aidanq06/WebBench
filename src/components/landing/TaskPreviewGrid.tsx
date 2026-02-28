"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { QUESTIONS } from "@/lib/benchmark/questions";
import { Badge } from "@/components/ui/badge";
import { QuestionText } from "@/components/benchmark/QuestionText";
import { Subject } from "@/types/agent";

const SUBJECTS: Subject[] = ["math", "logic", "coding", "reasoning"];

function subjectCount(subject: Subject) {
  return QUESTIONS.filter((q) => q.subject === subject).length;
}

const cardVariants = {
  hidden: { opacity: 0, y: 10 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, delay: i * 0.07, ease: "easeOut" as const },
  }),
};

export function TaskPreviewGrid() {
  const [activeSubject, setActiveSubject] = useState<Subject | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  const activeQuestions = activeSubject
    ? QUESTIONS.filter((q) => q.subject === activeSubject)
    : [];

  function handleCardClick(subject: Subject) {
    if (activeSubject === subject) {
      setActiveSubject(null);
      setOpenId(null);
    } else {
      setActiveSubject(subject);
      setOpenId(null);
    }
  }

  return (
    <section id="tasks" className="border-t px-6 py-12">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        {/* header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium tracking-tight">questions</h2>
          <span className="text-xs text-muted-foreground">
            {QUESTIONS.length} questions · 4 subjects · click a card to explore
          </span>
        </div>

        {/* subject cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {SUBJECTS.map((subject, i) => {
            const total = subjectCount(subject);
            const isActive = activeSubject === subject;

            return (
              <motion.button
                key={subject}
                custom={i}
                variants={cardVariants}
                initial="hidden"
                animate="show"
                onClick={() => handleCardClick(subject)}
                className={`flex flex-col gap-3 border p-5 text-left transition-colors hover:bg-accent/30 ${
                  isActive
                    ? "border-foreground/30 bg-accent"
                    : activeSubject !== null
                      ? "opacity-50"
                      : ""
                }`}
              >
                <div className="text-sm font-medium">{subject}</div>
                <div className="text-xs text-muted-foreground">
                  {total} questions
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* expanded question list */}
        <AnimatePresence initial={false}>
          {activeSubject && (
            <motion.div
              key={activeSubject}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="flex flex-col border">
                {activeQuestions.map((q) => {
                  const isOpen = openId === q.id;
                  return (
                    <div key={q.id} className="border-b last:border-b-0">
                      <button
                        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-accent/20"
                        onClick={() => setOpenId(isOpen ? null : q.id)}
                      >
                        <span className="w-8 shrink-0 font-mono text-xs text-muted-foreground/50">
                          {q.id}
                        </span>
                        <Badge variant="outline" className="shrink-0 text-[10px]">
                          {q.difficulty}
                        </Badge>
                        <span className="flex-1 truncate text-xs text-muted-foreground">
                          {q.text.replace(/\$\$?[^$]+\$\$?/g, "…").replace(/\n/g, " ")}
                        </span>
                        <motion.span
                          animate={{ rotate: isOpen ? 90 : 0 }}
                          transition={{ duration: 0.2 }}
                          className="shrink-0 text-[10px] text-muted-foreground/40"
                        >
                          ›
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
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
