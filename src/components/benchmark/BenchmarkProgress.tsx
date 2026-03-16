"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useBenchmarkStore } from "@/store/benchmark-store";
import { Badge } from "@/components/ui/badge";
import { QuestionText } from "./QuestionText";
import { parseThoughts } from "@/lib/benchmark/thought-parser";

// ── Slide variants ─────────────────────────────────────────────────────────────

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 32 : -32, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -32 : 32, opacity: 0 }),
};

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

  const [viewingIndex, setViewingIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const prevLengthRef = useRef(0);

  const correctCount = completedResults.filter((r) => r.correct).length;
  const progressPct = totalQuestions > 0 ? (completedResults.length / totalQuestions) * 100 : 0;
  const lastResult = completedResults[completedResults.length - 1];
  const isShowingResult = lastResult && lastResult.questionId === currentQuestion?.id;

  const thoughts = parseThoughts(streamingText);

  // Auto-advance to the newest thought when a new paragraph appears
  useEffect(() => {
    if (thoughts.length > prevLengthRef.current) {
      setDirection(1);
      setViewingIndex(thoughts.length - 1);
    }
    prevLengthRef.current = thoughts.length;
  }, [thoughts.length]);

  // Reset on each new question
  useEffect(() => {
    setViewingIndex(0);
    setDirection(1);
    prevLengthRef.current = 0;
  }, [currentQuestion?.id]);

  function goTo(index: number) {
    setDirection(index > viewingIndex ? 1 : -1);
    setViewingIndex(index);
  }

  const current = thoughts[viewingIndex] ?? null;

  return (
    <div className="flex h-full flex-col gap-5">
      {/* progress bar + counter */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>question {currentQuestionIndex + 1} / {totalQuestions}</span>
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
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">{currentQuestion.subject}</Badge>
              <Badge variant="outline" className="text-xs">{currentQuestion.difficulty}</Badge>
              <span className="ml-auto font-mono text-xs text-muted-foreground/50">
                {currentQuestion.id}
              </span>
            </div>
            <div className="text-base leading-relaxed text-foreground/70">
              <QuestionText text={currentQuestion.text} choices={currentQuestion.choices} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* thought viewer — fills remaining space */}
      <div className="flex min-h-0 flex-1 flex-col gap-3">

        {/* thinking indicator */}
        <AnimatePresence>
          {!streamingText && currentQuestion && !isShowingResult && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-1.5 text-sm text-muted-foreground/40"
            >
              <span className="animate-pulse">thinking</span>
              <span className="animate-pulse" style={{ animationDelay: "0.15s" }}>·</span>
              <span className="animate-pulse" style={{ animationDelay: "0.3s" }}>·</span>
              <span className="animate-pulse" style={{ animationDelay: "0.45s" }}>·</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* single thought card */}
        {thoughts.length > 0 && current && (
          <div className="relative min-h-0 flex-1 overflow-hidden">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={viewingIndex}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="absolute inset-0 overflow-y-auto [&::-webkit-scrollbar]:w-[3px] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20"
              >
                {current.type === "answer" ? (
                  <div className="flex items-center gap-3 py-3">
                    <span className="h-px flex-1 bg-muted-foreground/15" />
                    <span className="font-mono text-sm font-medium text-foreground">
                      ANSWER: {current.full.match(/ANSWER:\s*([ABCD])/i)?.[1]?.toUpperCase() ?? ""}
                    </span>
                    <span className="h-px flex-1 bg-muted-foreground/15" />
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 pr-1">
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground/30">
                      thought {viewingIndex + 1}
                    </span>
                    <p className="text-sm leading-relaxed text-muted-foreground/70">
                      {current.full}
                      {current.streaming && (
                        <span className="ml-1 animate-pulse text-muted-foreground/30">▊</span>
                      )}
                    </p>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        )}

        {/* dot navigation */}
        {thoughts.length > 1 && (
          <div className="flex flex-shrink-0 items-center justify-center gap-2">
            {thoughts.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={`h-1 rounded-full transition-all duration-200 ${
                  i === viewingIndex
                    ? "w-4 bg-foreground/60"
                    : "w-1 bg-muted-foreground/20 hover:bg-muted-foreground/40"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* result flash */}
      <AnimatePresence>
        {isShowingResult && (
          <motion.div
            key={lastResult.questionId + "-result"}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className={`flex flex-col gap-2 border p-5 ${
              lastResult.correct
                ? "border-green-600/50 bg-green-600/5"
                : "border-red-600/50 bg-red-600/5"
            }`}
          >
            <div className={`text-sm font-medium ${lastResult.correct ? "text-green-600" : "text-red-600"}`}>
              {lastResult.correct ? "correct" : "incorrect"}
            </div>
            <div className="flex gap-4 text-sm text-muted-foreground">
              <span>
                extracted:{" "}
                <span className="font-mono text-foreground">
                  {lastResult.extractedAnswer || "(none)"}
                </span>
              </span>
              <span>
                expected:{" "}
                <span className="font-mono text-foreground">
                  {lastResult.expectedAnswer}
                </span>
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* next question button — manual mode only */}
      <AnimatePresence>
        {waitingForAdvance && advanceMode === "manual" && (
          <motion.button
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            onClick={triggerAdvance}
            whileTap={{ scale: 0.99 }}
            className="w-full border bg-primary py-4 text-base text-primary-foreground transition-colors hover:bg-primary/90"
          >
            next question →
          </motion.button>
        )}
      </AnimatePresence>

      {/* bottom bar: mode toggle + end */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-muted-foreground/40">
          <span className="uppercase tracking-widest">advance</span>
          {(["auto", "manual"] as const).map((mode, i) => (
            <span key={mode} className="flex items-center">
              {i > 0 && <span className="mx-1.5 text-muted-foreground/15">·</span>}
              <button
                onClick={() => setAdvanceMode(mode)}
                className={`transition-colors duration-150 ${
                  advanceMode === mode
                    ? "font-medium text-foreground"
                    : "text-muted-foreground/30 hover:text-muted-foreground"
                }`}
              >
                {mode}
              </button>
            </span>
          ))}
        </div>
        <button
          onClick={abort}
          className="text-xs text-muted-foreground/30 transition-colors hover:text-destructive"
        >
          end benchmark
        </button>
      </div>
    </div>
  );
}
