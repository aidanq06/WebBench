"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useBenchmarkStore } from "@/store/benchmark-store";
import { QuestionText } from "./QuestionText";
import { parseThoughts, ThoughtSegment } from "@/lib/benchmark/thought-parser";

function questionFontClass(text: string, choices: string[]): string {
  const len = text.length + choices.join("").length;
  if (len < 150) return "text-lg";
  if (len < 300) return "text-base";
  if (len < 500) return "text-sm";
  return "text-xs";
}

// ── ThoughtStep ────────────────────────────────────────────────────────────────

function ThoughtStep({
  thought,
  isExpanded,
  onToggle,
}: {
  thought: ThoughtSegment;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const canExpand = !thought.streaming && thought.full.length > thought.preview.length;

  return (
    <div className="flex flex-col">
      <button onClick={onToggle} className="group flex items-start gap-2.5 text-left">
        <span
          className={`mt-[5px] h-1 w-1 shrink-0 rounded-full transition-colors ${
            thought.streaming ? "animate-pulse bg-foreground/50" : "bg-muted-foreground/20"
          }`}
        />
        <span
          className={`text-xs leading-relaxed transition-colors group-hover:text-muted-foreground/60 ${
            thought.streaming ? "text-muted-foreground/55" : "text-muted-foreground/30"
          }`}
        >
          {thought.preview}
        </span>
        {canExpand && (
          <motion.span
            animate={{ rotate: isExpanded ? 90 : 0 }}
            transition={{ duration: 0.15 }}
            className="mt-0.5 shrink-0 text-[10px] text-muted-foreground/15"
          >
            ›
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <p className="ml-3.5 mt-1.5 text-xs leading-relaxed text-muted-foreground/25">
              {thought.full}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── BenchmarkProgress ──────────────────────────────────────────────────────────

export function BenchmarkProgress() {
  const {
    currentQuestionIndex,
    currentQuestion,
    totalQuestions,
    completedResults,
    streamingText,
    waitingForAdvance,
    advanceMode,
    setAdvanceMode,
    triggerAdvance,
    abort,
  } = useBenchmarkStore();

  const [logOpen, setLogOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [durationSeconds, setDurationSeconds] = useState(0);

  const startTimeRef = useRef<number | null>(null);

  const correctCount = completedResults.filter((r) => r.correct).length;
  const progressPct = totalQuestions > 0 ? (completedResults.length / totalQuestions) * 100 : 0;
  const lastResult = completedResults[completedResults.length - 1];
  const isShowingResult = !!(lastResult && lastResult.questionId === currentQuestion?.id);

  const thoughts = parseThoughts(streamingText);
  const visibleThoughts = thoughts.filter((t) => t.type !== "answer");

  // Start elapsed timer when streaming begins
  useEffect(() => {
    if (!streamingText) return;
    if (startTimeRef.current !== null) return;
    startTimeRef.current = Date.now();
    const interval = setInterval(() => {
      if (startTimeRef.current !== null) {
        setElapsedSeconds(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }
    }, 1000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!streamingText]);

  // Freeze duration when result lands
  useEffect(() => {
    if (isShowingResult && startTimeRef.current !== null) {
      setDurationSeconds(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }
  }, [isShowingResult]);

  // Reset on new question
  useEffect(() => {
    startTimeRef.current = null;
    setElapsedSeconds(0);
    setDurationSeconds(0);
    setLogOpen(false);
    setExpandedId(null);
  }, [currentQuestion?.id]);

  return (
    <div className="relative flex h-full flex-col gap-5">
      {/* manual advance — click anywhere */}
      <AnimatePresence>
        {waitingForAdvance && advanceMode === "manual" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={triggerAdvance}
            className="absolute inset-0 z-20 flex cursor-pointer items-end justify-center pb-24"
          >
            <span className="text-xs text-muted-foreground/30">click to continue →</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* progress bar */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            question {currentQuestionIndex + 1} / {totalQuestions}
          </span>
          <span>{correctCount} correct</span>
        </div>
        <div className="relative h-1 w-full bg-secondary">
          <motion.div
            className="absolute inset-y-0 left-0 bg-foreground"
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* question card */}
      <AnimatePresence mode="wait">
        {currentQuestion && (
          <motion.div
            key={currentQuestion.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="flex flex-col gap-4 border p-6"
          >
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground/30">
              {currentQuestion.subject} · {currentQuestion.difficulty}
            </p>
            <div
              className={`leading-relaxed text-foreground/70 ${questionFontClass(currentQuestion.text, currentQuestion.choices)}`}
            >
              <QuestionText text={currentQuestion.text} choices={currentQuestion.choices} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* thinking area */}
      <div className="flex min-h-0 flex-1 flex-col">
        <AnimatePresence mode="wait">
          {/* waiting */}
          {!streamingText && currentQuestion && !isShowingResult && (
            <motion.p
              key="waiting"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="animate-pulse text-xs text-muted-foreground/25"
            >
              thinking...
            </motion.p>
          )}

          {/* step list — stream is live */}
          {streamingText && !isShowingResult && (
            <motion.div
              key="steps"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="relative flex min-h-0 flex-1 flex-col gap-2"
            >
              <span className="absolute right-0 top-0 font-mono text-[10px] text-muted-foreground/20">
                {elapsedSeconds}s
              </span>
              {visibleThoughts.slice(-4).map((t) => (
                <ThoughtStep
                  key={t.id}
                  thought={t}
                  isExpanded={expandedId === t.id}
                  onToggle={() => setExpandedId((id) => (id === t.id ? null : t.id))}
                />
              ))}
            </motion.div>
          )}

          {/* disclosure — result landed */}
          {isShowingResult && (
            <motion.div
              key="disclosure"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {visibleThoughts.length > 0 && (
                <>
                  <button
                    onClick={() => setLogOpen((o) => !o)}
                    className="text-xs text-muted-foreground/35 transition-colors hover:text-muted-foreground"
                  >
                    thought for {durationSeconds}s {logOpen ? "↑" : "↓"}
                  </button>
                  <AnimatePresence>
                    {logOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-3 flex max-h-64 flex-col gap-1.5 overflow-y-auto [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-[3px]">
                          {visibleThoughts.map((t) => (
                            <ThoughtStep
                              key={t.id}
                              thought={t}
                              isExpanded={expandedId === t.id}
                              onToggle={() => setExpandedId((id) => (id === t.id ? null : t.id))}
                            />
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* result */}
      <AnimatePresence>
        {isShowingResult && (
          <motion.div
            key={lastResult.questionId + "-result"}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className={`border p-5 ${
              lastResult.correct
                ? "border-green-600/50 bg-green-600/5"
                : "border-red-600/50 bg-red-600/5"
            }`}
          >
            <div
              className={`text-lg font-medium ${
                lastResult.correct ? "text-green-600" : "text-red-600"
              }`}
            >
              {lastResult.correct ? "correct" : "incorrect"}
            </div>
            <div className="mt-0.5 font-mono text-sm text-muted-foreground">
              {lastResult.extractedAnswer || "—"} · expected {lastResult.expectedAnswer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* bottom bar — barely visible, hover to reveal */}
      <div className="flex items-center justify-between opacity-30 transition-opacity hover:opacity-100">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {(["auto", "manual"] as const).map((mode, i) => (
            <span key={mode} className="flex items-center">
              {i > 0 && <span className="mx-1.5 text-muted-foreground/30">·</span>}
              <button
                onClick={() => setAdvanceMode(mode)}
                className={`transition-colors duration-150 ${
                  advanceMode === mode ? "font-medium text-foreground" : "hover:text-foreground"
                }`}
              >
                {mode}
              </button>
            </span>
          ))}
        </div>
        <button
          onClick={abort}
          className="text-xs text-muted-foreground transition-colors hover:text-destructive"
        >
          end
        </button>
      </div>
    </div>
  );
}
