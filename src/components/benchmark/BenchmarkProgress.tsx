"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence, useAnimationControls } from "framer-motion";
import { useBenchmarkStore } from "@/store/benchmark-store";
import { QuestionText } from "./QuestionText";
import { EXTRACT_SOURCE_LABEL } from "@/lib/benchmark/answer-extractor";

// ── Pacing constants ──────────────────────────────────────────────────────────
const MIN_REVEAL_MS_WITH_REASONING = 2500;
const MIN_REVEAL_MS_NO_REASONING = 2200;
const POST_REVEAL_MS = 3000;

// Matches text-sm leading-relaxed
const LINE_HEIGHT_PX = 24;
// Fixed box height (h-[22rem] = 22 × 16px)
const BOX_HEIGHT_PX = 352;

// Dynamic question-text sizing: pick the largest font where rendered content
// height still fits inside the box (binary search). Short questions scale UP,
// long ones scale DOWN. Combined with vertical centering on the outer box, the
// padding to all four edges stays visually uniform across questions.
const QUESTION_PAD_PX = 24; // p-6
const QUESTION_MAX_FONT_PX = 30;
const QUESTION_MIN_FONT_PX = 12;
const QUESTION_CONTENT_HEIGHT_LIMIT = BOX_HEIGHT_PX - 2 * QUESTION_PAD_PX;

// ── Markdown stripper ────────────────────────────────────────────────────────
function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/\*([^*\n]+)\*/g, "$1")
    .replace(/(?<!\w)_([^_\n]+)_(?!\w)/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^[-*]\s+/gm, "");
}

// ── Main component ────────────────────────────────────────────────────────────

export function BenchmarkProgress() {
  const {
    currentQuestion,
    currentQuestionIndex,
    completedResults,
    streamingText,
    waitingForAdvance,
    advanceMode,
    setAdvanceMode,
    triggerAdvance,
    abort,
  } = useBenchmarkStore();

  const [revealVisible, setRevealVisible] = useState(false);
  const [offset, setOffset] = useState(0);
  const [textHeight, setTextHeight] = useState(0);

  const questionStartRef = useRef<number>(0);
  const boxRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLParagraphElement>(null);
  const lastAutoOffsetRef = useRef(0);
  const isPausedRef = useRef(false);
  const offsetRef = useRef(0);

  const controls = useAnimationControls();

  // Binary search for the largest font where the rendered content fits inside
  // the available box height. If even at MIN the content overflows, fall back
  // to letting the inner content scroll rather than clipping silently.
  const fitQuestionText = useCallback((el: HTMLDivElement | null) => {
    if (!el) return;
    el.style.overflowY = "hidden";
    el.style.maxHeight = `${QUESTION_CONTENT_HEIGHT_LIMIT}px`;
    let lo = QUESTION_MIN_FONT_PX;
    let hi = QUESTION_MAX_FONT_PX;
    let best = QUESTION_MIN_FONT_PX;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      el.style.fontSize = `${mid}px`;
      if (el.scrollHeight <= QUESTION_CONTENT_HEIGHT_LIMIT) {
        best = mid;
        lo = mid + 1;
      } else {
        hi = mid - 1;
      }
    }
    el.style.fontSize = `${best}px`;
    if (el.scrollHeight > QUESTION_CONTENT_HEIGHT_LIMIT) {
      el.style.overflowY = "auto";
    }
  }, []);

  const lastResult = completedResults[completedResults.length - 1];
  const isShowingResult = !!(lastResult && lastResult.questionId === currentQuestion?.id);

  // Show the raw stream verbatim — including ANSWER: line if the model emitted
  // one. Only the <think> tags are stripped (they're noise from reasoning models)
  // and basic markdown is flattened so bold/italic don't render as raw asterisks.
  const visibleText = useMemo(() => {
    const cleaned = streamingText.replace(/<\/?think>/gi, "").trim();
    return stripMarkdown(cleaned);
  }, [streamingText]);

  // Keep offsetRef synced (so wheel handler sees current value)
  useEffect(() => {
    offsetRef.current = offset;
  }, [offset]);

  // Reset on question change
  useEffect(() => {
    if (!currentQuestion) return;
    setRevealVisible(false);
    setOffset(0);
    setTextHeight(0);
    lastAutoOffsetRef.current = 0;
    isPausedRef.current = false;
    offsetRef.current = 0;
    controls.set({ y: 0 });
    questionStartRef.current = Date.now();
  }, [currentQuestion?.id, controls]);

  // Measure text height + trigger page-flip animation
  useEffect(() => {
    const txt = textRef.current;
    if (!txt) return;
    const tHeight = txt.offsetHeight;
    setTextHeight(tHeight);
    if (isPausedRef.current) return;
    if (tHeight > lastAutoOffsetRef.current + BOX_HEIGHT_PX) {
      const newOffset = Math.max(0, tHeight - LINE_HEIGHT_PX - 4);
      lastAutoOffsetRef.current = newOffset;
      offsetRef.current = newOffset;
      setOffset(newOffset);
      controls.start({
        y: -newOffset,
        transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }, // easeOutExpo
      });
    }
  }, [visibleText, controls]);

  // Wheel handler — user override. Uses native event so we can preventDefault.
  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const handler = (e: WheelEvent) => {
      const max = lastAutoOffsetRef.current;
      if (max === 0) return; // nothing scrollable yet — let parent handle
      const current = offsetRef.current;
      const next = Math.max(0, Math.min(max, current + e.deltaY));
      if (next === current) return; // at edge — let parent handle
      e.preventDefault();
      offsetRef.current = next;
      setOffset(next);
      controls.set({ y: -next });
      isPausedRef.current = next < max - 4;
    };
    box.addEventListener("wheel", handler, { passive: false });
    return () => box.removeEventListener("wheel", handler);
  }, [controls]);

  // Reveal pacing
  useEffect(() => {
    if (!isShowingResult) {
      setRevealVisible(false);
      return;
    }
    const hasReasoning = visibleText.length > 0;
    const elapsed = Date.now() - questionStartRef.current;
    const minTotal = hasReasoning ? MIN_REVEAL_MS_WITH_REASONING : MIN_REVEAL_MS_NO_REASONING;
    const delay = Math.max(0, minTotal - elapsed);
    const t = setTimeout(() => setRevealVisible(true), delay);
    return () => clearTimeout(t);
  }, [isShowingResult, visibleText.length]);

  // Auto-advance after reveal
  useEffect(() => {
    if (!revealVisible || advanceMode !== "auto" || !waitingForAdvance) return;
    const t = setTimeout(triggerAdvance, POST_REVEAL_MS);
    return () => clearTimeout(t);
  }, [revealVisible, advanceMode, waitingForAdvance, triggerAdvance]);

  if (!currentQuestion) return null;

  const showTopShadow = offset > 4;
  const showBottomShadow = textHeight > offset + BOX_HEIGHT_PX + 2;

  return (
    <div className="relative flex flex-col gap-5">
      {/* Header: dots + mode toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-baseline">
          <AnimatePresence mode="wait">
            <motion.span
              key={currentQuestion.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="font-serif text-2xl font-medium tracking-tight"
            >
              {currentQuestionIndex + 1}.
            </motion.span>
          </AnimatePresence>
        </div>

        <div className="flex items-center gap-0 text-xs text-muted-foreground">
          {(["auto", "manual"] as const).map((mode, i) => (
            <span key={mode} className="flex items-center">
              {i > 0 && <span className="mx-1.5 text-[--fg-subtle]">·</span>}
              <button
                onClick={() => setAdvanceMode(mode)}
                className={`transition-colors ${
                  advanceMode === mode ? "font-medium text-foreground" : "hover:text-foreground"
                }`}
              >
                {mode}
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Two-column body: question (left) | raw output (right) */}
      <div className="flex items-start gap-8">
        {/* Question (left) */}
        <div className="flex-1 max-w-md">
          <div className="flex h-[22rem] flex-col justify-center border border-[--border] p-6 overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentQuestion.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              >
                <div ref={fitQuestionText}>
                  <QuestionText
                    text={currentQuestion.text}
                    choices={currentQuestion.choices}
                    highlightCorrect={
                      revealVisible
                        ? (lastResult?.expectedAnswer as "A" | "B" | "C" | "D" | undefined)
                        : undefined
                    }
                    highlightSelected={
                      revealVisible
                        ? (lastResult?.extractedAnswer as "A" | "B" | "C" | "D" | undefined)
                        : undefined
                    }
                  />
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Raw output (right) — fixed height, animated page-flip, wheel override */}
        <div className="flex-1 flex flex-col gap-3">
          <div ref={boxRef} className="relative h-[22rem] overflow-hidden">
            <motion.div animate={controls} initial={{ y: 0 }}>
              {visibleText ? (
                <p
                  ref={textRef}
                  className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/85"
                >
                  {visibleText}
                  {!isShowingResult && (
                    <span className="ml-0.5 text-foreground/40">▌</span>
                  )}
                </p>
              ) : !isShowingResult ? (
                <p ref={textRef} className="text-sm text-[--fg-subtle]">
                  …
                </p>
              ) : (
                <p ref={textRef} />
              )}
            </motion.div>

            {/* shadow overlays */}
            <div
              className={`pointer-events-none absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-[--background] to-transparent transition-opacity duration-300 ${
                showTopShadow ? "opacity-100" : "opacity-0"
              }`}
            />
            <div
              className={`pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-[--background] to-transparent transition-opacity duration-300 ${
                showBottomShadow ? "opacity-100" : "opacity-0"
              }`}
            />
          </div>

          {/* Explicit final-answer line — fades in on reveal. Replaces the
              old yellow last-sentence highlight (which was misleading because
              the streamed reasoning often had nothing to do with the committed
              letter). Green when correct, red when wrong, subtle when absent. */}
          <AnimatePresence>
            {revealVisible && lastResult && (
              <motion.div
                key="final-answer"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="flex items-center gap-2 font-mono text-sm"
              >
                <span className="text-[--fg-subtle]">→</span>
                {lastResult.extractedAnswer ? (
                  <>
                    <span
                      className={`rounded-sm px-2 py-0.5 ${
                        lastResult.extractedAnswer === lastResult.expectedAnswer
                          ? "bg-green-600/10 text-green-700 dark:text-green-400"
                          : "bg-red-600/10 text-red-700 dark:text-red-400"
                      }`}
                    >
                      {lastResult.extractedAnswer}
                    </span>
                    <span className="text-[10px] text-[--fg-subtle]">
                      via {EXTRACT_SOURCE_LABEL[lastResult.extractionSource]}
                    </span>
                  </>
                ) : (
                  <span className="text-[--fg-subtle]">no answer found in output</span>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="flex items-center gap-4 text-xs">

        {revealVisible && advanceMode === "manual" && waitingForAdvance && (
          <button
            onClick={triggerAdvance}
            className="relative z-20 text-foreground transition-colors hover:text-foreground/80"
          >
            next →
          </button>
        )}

        <button
          onClick={abort}
          className="relative z-20 ml-auto text-[--fg-subtle] transition-colors hover:text-destructive"
        >
          end
        </button>
      </div>

      {/* Click-anywhere advance overlay (manual mode, after reveal) */}
      {revealVisible && advanceMode === "manual" && waitingForAdvance && (
        <div
          onClick={triggerAdvance}
          className="absolute inset-0 z-10 cursor-pointer"
          aria-hidden
        />
      )}
    </div>
  );
}
