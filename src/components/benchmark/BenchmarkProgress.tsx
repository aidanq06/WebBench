"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useBenchmarkStore } from "@/store/benchmark-store";
import { Badge } from "@/components/ui/badge";
import { QuestionText } from "./QuestionText";

export function BenchmarkProgress() {
  const {
    currentQuestionIndex,
    currentQuestion,
    totalQuestions,
    completedResults,
    streamingText,
  } = useBenchmarkStore();

  const streamEndRef = useRef<HTMLDivElement>(null);
  const correctCount = completedResults.filter((r) => r.correct).length;
  const progressPct = totalQuestions > 0 ? (completedResults.length / totalQuestions) * 100 : 0;
  const lastResult = completedResults[completedResults.length - 1];
  const isShowingResult = lastResult && lastResult.questionId === currentQuestion?.id;

  useEffect(() => {
    streamEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [streamingText]);

  return (
    <div className="flex flex-col gap-6">
      {/* progress bar + counter */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            question {currentQuestionIndex + 1} / {totalQuestions}
          </span>
          <span>{correctCount} correct</span>
        </div>
        <div className="relative h-0.5 w-full bg-secondary">
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
            className="flex flex-col gap-4 border p-8"
          >
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-[10px]">
                {currentQuestion.subject}
              </Badge>
              <Badge variant="outline" className="text-[10px]">
                {currentQuestion.difficulty}
              </Badge>
              <span className="ml-auto font-mono text-[10px] text-muted-foreground/50">
                {currentQuestion.id}
              </span>
            </div>
            <div className="text-base leading-relaxed text-foreground/70">
              <QuestionText text={currentQuestion.text} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* streaming output */}
      <AnimatePresence>
        {streamingText && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="border-l-2 border-muted-foreground/20 pl-3"
          >
            <div className="mb-1 text-[10px] text-muted-foreground">model response</div>
            <div className="max-h-48 overflow-y-auto">
              <pre className="whitespace-pre-wrap text-xs text-muted-foreground/80">
                {streamingText}
              </pre>
              <div ref={streamEndRef} />
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
            className={`flex flex-col gap-1 border p-4 ${
              lastResult.correct
                ? "border-green-600/50 bg-green-600/5"
                : "border-red-600/50 bg-red-600/5"
            }`}
          >
            <div
              className={`text-xs font-medium ${
                lastResult.correct ? "text-green-600" : "text-red-600"
              }`}
            >
              {lastResult.correct ? "correct" : "incorrect"}
            </div>
            <div className="flex gap-4 text-xs text-muted-foreground">
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
  );
}
