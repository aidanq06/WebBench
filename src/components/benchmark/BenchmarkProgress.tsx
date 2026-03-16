"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useBenchmarkStore } from "@/store/benchmark-store";
import { Badge } from "@/components/ui/badge";
import { QuestionText } from "./QuestionText";
import { parseThoughts, ThoughtSegment } from "@/lib/benchmark/thought-parser";

// ── ThoughtCard ────────────────────────────────────────────────────────────────

function ThoughtCard({
  segment,
  index,
  expanded,
  onToggle,
}: {
  segment: ThoughtSegment;
  index: number;
  expanded: boolean;
  onToggle: () => void;
}) {
  if (segment.type === "answer") {
    const letter = segment.full.match(/ANSWER:\s*([ABCD])/i)?.[1]?.toUpperCase() ?? "";
    return (
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="flex items-center gap-3 py-2"
      >
        <span className="h-px flex-1 bg-muted-foreground/15" />
        <span className="font-mono text-sm font-medium text-foreground">
          ANSWER: {letter}
        </span>
        <span className="h-px flex-1 bg-muted-foreground/15" />
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 3 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className="flex flex-col"
    >
      <button
        onClick={onToggle}
        className="flex items-baseline gap-3 py-1.5 text-left transition-colors hover:text-foreground"
      >
        <span className="shrink-0 text-[10px] text-muted-foreground/30">
          {expanded ? "▾" : "◦"}
        </span>
        <span className="shrink-0 text-[10px] uppercase tracking-widest text-muted-foreground/30">
          thought {index + 1}
        </span>
        {!expanded && (
          <span className="truncate text-sm text-muted-foreground/50">
            {segment.preview}
          </span>
        )}
        {segment.streaming && !expanded && (
          <span className="ml-1 shrink-0 animate-pulse text-xs text-muted-foreground/30">·</span>
        )}
        <span className="ml-auto shrink-0 text-xs text-muted-foreground/20">›</span>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="pb-3 pl-[4.5rem] pr-2 text-sm leading-relaxed text-muted-foreground/70">
              {segment.full}
              {segment.streaming && (
                <span className="ml-1 animate-pulse text-muted-foreground/30">▊</span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
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

  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);

  const correctCount = completedResults.filter((r) => r.correct).length;
  const progressPct = totalQuestions > 0 ? (completedResults.length / totalQuestions) * 100 : 0;
  const lastResult = completedResults[completedResults.length - 1];
  const isShowingResult = lastResult && lastResult.questionId === currentQuestion?.id;

  const thoughts = parseThoughts(streamingText);

  // Auto-expand the answer segment when it appears
  useEffect(() => {
    const answer = thoughts.find((t) => t.type === "answer");
    if (answer) {
      setExpanded((prev) => {
        if (prev.has(answer.id)) return prev;
        return new Set([...prev, answer.id]);
      });
    }
  }, [thoughts.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset expanded state on each new question
  useEffect(() => {
    setExpanded(new Set());
  }, [currentQuestion?.id]);

  // Scroll thought container to bottom only when a new paragraph appears (not every token)
  useEffect(() => {
    const el = containerRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [thoughts.length]);

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

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

      {/* thinking / thought chart — fills remaining space */}
      <div className="relative min-h-0 flex-1">
        {/* thinking indicator — before first token */}
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

        {/* thought chart */}
        {thoughts.length > 0 && (
          <div className="absolute inset-0 flex flex-col">
            {/* top fade */}
            <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-8 bg-gradient-to-b from-background to-transparent" />

            <div
              ref={containerRef}
              className="h-full overflow-y-auto [&::-webkit-scrollbar]:w-[3px] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20"
            >
              <div className="flex flex-col divide-y divide-muted-foreground/[0.06] py-1">
                {thoughts.map((segment, i) => (
                  <ThoughtCard
                    key={segment.id}
                    segment={segment}
                    index={i}
                    expanded={expanded.has(segment.id)}
                    onToggle={() => toggle(segment.id)}
                  />
                ))}
              </div>
            </div>

            {/* bottom fade */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-background to-transparent" />
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
          {(["auto", "manual"] as const).map((mode, i, arr) => (
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
