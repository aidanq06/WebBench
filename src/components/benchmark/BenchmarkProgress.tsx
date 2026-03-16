"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { useBenchmarkStore } from "@/store/benchmark-store";
import { Badge } from "@/components/ui/badge";
import { QuestionText } from "./QuestionText";

function parseThinkBlock(text: string): { thinking: string; rest: string } {
  const match = text.match(/^<think>([\s\S]*?)<\/think>([\s\S]*)$/i);
  if (match) return { thinking: match[1].trim(), rest: match[2].trim() };
  // Handle unclosed think tag (still streaming)
  const open = text.match(/^<think>([\s\S]*)$/i);
  if (open) return { thinking: open[1].trim(), rest: "" };
  return { thinking: "", rest: text };
}

export function BenchmarkProgress() {
  const {
    currentQuestionIndex,
    currentQuestion,
    totalQuestions,
    completedResults,
    streamingText,
    waitingForAdvance,
    advanceMode,
    triggerAdvance,
    abort,
  } = useBenchmarkStore();

  const streamEndRef = useRef<HTMLDivElement>(null);
  const correctCount = completedResults.filter((r) => r.correct).length;
  const progressPct = totalQuestions > 0 ? (completedResults.length / totalQuestions) * 100 : 0;
  const lastResult = completedResults[completedResults.length - 1];
  const isShowingResult = lastResult && lastResult.questionId === currentQuestion?.id;

  const { thinking, rest } = parseThinkBlock(streamingText);
  const hasThinkBlock = !!thinking;

  useEffect(() => {
    streamEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [streamingText]);

  return (
    <div className="flex w-full flex-col gap-4">
      {/* ── progress bar ── */}
      <div className="flex flex-shrink-0 flex-col gap-2">
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

      {/* ── two-column body ── */}
      <div className="grid flex-1 grid-cols-2 gap-8 overflow-hidden" style={{ height: "calc(100vh - 10rem)" }}>

        {/* ── LEFT: question ── */}
        <div className="flex flex-col gap-5 overflow-y-auto pr-2">
          <AnimatePresence mode="wait">
            {currentQuestion && (
              <motion.div
                key={currentQuestion.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="flex flex-col gap-5 border p-8"
              >
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {currentQuestion.subject}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {currentQuestion.difficulty}
                  </Badge>
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
        </div>

        {/* ── RIGHT: response ── */}
        <div className="flex flex-col gap-4 overflow-hidden">

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

          {/* scrollable response area */}
          <div className="flex flex-1 flex-col gap-3 overflow-y-auto">
            <AnimatePresence>
              {streamingText && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col gap-3"
                >
                  {/* thinking block (DeepSeek R1) */}
                  {hasThinkBlock && (
                    <div className="border-l-2 border-muted-foreground/15 pl-4">
                      <div className="mb-2 text-xs text-muted-foreground/40">thinking</div>
                      <div className="prose prose-sm prose-invert max-w-none italic text-muted-foreground/40 [&_*]:text-muted-foreground/40">
                        <ReactMarkdown>{thinking}</ReactMarkdown>
                      </div>
                    </div>
                  )}

                  {/* main response */}
                  {(rest || !hasThinkBlock) && (
                    <div className="border-l-2 border-muted-foreground/20 pl-4">
                      <div className="mb-2 text-xs text-muted-foreground">model response</div>
                      <div className="prose prose-sm prose-invert max-w-none text-muted-foreground/80 [&_*]:text-muted-foreground/80">
                        <ReactMarkdown>{rest || streamingText}</ReactMarkdown>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
            <div ref={streamEndRef} />
          </div>

          {/* manual advance button */}
          <AnimatePresence>
            {waitingForAdvance && advanceMode === "manual" && (
              <motion.button
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                onClick={triggerAdvance}
                whileTap={{ scale: 0.99 }}
                className="w-full flex-shrink-0 border bg-primary py-4 text-base text-primary-foreground transition-colors hover:bg-primary/90"
              >
                next question →
              </motion.button>
            )}
          </AnimatePresence>

          {/* end benchmark */}
          <div className="flex flex-shrink-0 justify-end">
            <button
              onClick={abort}
              className="text-xs text-muted-foreground/30 transition-colors hover:text-destructive"
            >
              end benchmark
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
