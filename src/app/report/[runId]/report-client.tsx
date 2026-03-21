"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, animate, useMotionValue } from "framer-motion";
import { BenchmarkReport } from "@/types/report";
import { QUESTIONS } from "@/lib/benchmark/questions";
import { QuestionText } from "@/components/benchmark/QuestionText";
import { Navbar } from "@/components/landing/Navbar";
import { AVAILABLE_MODELS, modelLogo } from "@/lib/webllm/models";
import { SCORING } from "@/lib/benchmark/scoring-config";
import type { QuestionResult } from "@/types/task";

// ── Animated pts counter ───────────────────────────────────────────────────────
function AnimatedPts({ value, delay = 0 }: { value: number; delay?: number }) {
  const mv = useMotionValue(0);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const controls = animate(mv, value, {
      duration: 0.6,
      delay,
      ease: "easeOut",
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  return <>{display}</>;
}

// ── Score breakdown ────────────────────────────────────────────────────────────
export function ScoreBreakdown({
  questionResults,
  totalQuestions,
  activeDifficulty,
  onDifficultyClick,
}: {
  questionResults: QuestionResult[];
  totalQuestions: number;
  activeDifficulty: string | null;
  onDifficultyClick: (d: string | null) => void;
}) {
  const { weights, scale } = SCORING;
  const possible = totalQuestions * weights.hard;

  const tiers = (["easy", "medium", "hard"] as const)
    .map((diff, i) => {
      const results = questionResults.filter((r) => r.difficulty === diff);
      const correct = results.filter((r) => r.correct).length;
      const total = results.length;
      const pts = total > 0 ? Math.round((correct * weights[diff]) / possible * scale) : 0;
      const maxPts = Math.round((total * weights[diff]) / possible * scale);
      const fillPct = maxPts > 0 ? (pts / maxPts) * 100 : 0;
      return { diff, correct, total, pts, maxPts, fillPct, delay: i * 0.1 };
    })
    .filter((t) => t.total > 0);

  return (
    <div className="flex flex-col gap-1">
      {tiers.map((tier) => {
        const isActive = activeDifficulty === tier.diff;
        const isInactive = activeDifficulty !== null && !isActive;
        return (
          <motion.button
            key={tier.diff}
            onClick={() => onDifficultyClick(isActive ? null : tier.diff)}
            animate={{ opacity: isInactive ? 0.25 : 1 }}
            transition={{ duration: 0.18 }}
            className="-mx-3 flex cursor-pointer items-center gap-4 rounded-sm px-3 py-3 text-left transition-colors hover:bg-accent/8"
          >
            {/* difficulty label */}
            <span className="w-16 shrink-0 text-xs text-muted-foreground">{tier.diff}</span>

            {/* accuracy bar for this tier */}
            <div className="relative h-px flex-1 bg-secondary">
              <motion.div
                className="absolute inset-y-0 left-0 bg-foreground"
                initial={{ width: 0 }}
                animate={{ width: `${tier.fillPct}%` }}
                transition={{ duration: 0.65, delay: tier.delay, ease: "easeOut" }}
              />
            </div>

            {/* correct / total */}
            <span className="w-10 shrink-0 text-right font-mono text-[10px] tabular-nums text-muted-foreground/35">
              {tier.correct}/{tier.total}
            </span>

            {/* pts contribution */}
            <span className="w-24 shrink-0 text-right text-base font-semibold tabular-nums">
              +<AnimatedPts value={tier.pts} delay={tier.delay} />
              <span className="ml-1 text-[10px] font-normal text-muted-foreground/40">pts</span>
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}

// ── Reasoning log ─────────────────────────────────────────────────────────────
function ReasoningLog({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const clean = text.replace(/<\/?think>/gi, "").trim();
  if (!clean) return null;
  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={() => setOpen((o) => !o)}
        className="text-left text-xs text-muted-foreground/35 transition-colors hover:text-muted-foreground"
      >
        reasoning {open ? "↑" : "↓"}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="max-h-64 overflow-y-auto whitespace-pre-wrap text-xs leading-relaxed text-muted-foreground/50 [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-[3px]">
              {clean}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Share button ──────────────────────────────────────────────────────────────
function ShareButton({ runId }: { runId: string }) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const url = `${window.location.origin}/report/${runId}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleShare}
      className="text-xs text-muted-foreground transition-colors hover:text-foreground"
    >
      {copied ? <span className="text-green-600">copied ✓</span> : "share"}
    </button>
  );
}

// ── Stagger variants ──────────────────────────────────────────────────────────
const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
};

// ── Main client component ─────────────────────────────────────────────────────
export function ReportClient({
  runId,
  dbReport,
  savedToDb,
}: {
  runId: string;
  dbReport: BenchmarkReport | null;
  savedToDb: boolean;
}) {
  const router = useRouter();
  const [report, setReport] = useState<BenchmarkReport | null>(dbReport);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeDifficulty, setActiveDifficulty] = useState<string | null>(null);

  // Fall back to sessionStorage if not in DB (unsigned user, same session)
  useEffect(() => {
    if (!report) {
      const stored = sessionStorage.getItem(`report-${runId}`);
      if (stored) setReport(JSON.parse(stored));
    }
  }, [runId, report]);

  if (!report) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <div className="flex flex-1 flex-col items-center justify-center gap-4">
          <div className="text-sm text-muted-foreground">report not found</div>
          <button
            className="border px-4 py-2 text-sm hover:bg-accent/50"
            onClick={() => router.push("/benchmark")}
          >
            run a benchmark
          </button>
        </div>
      </div>
    );
  }

  const model = AVAILABLE_MODELS.find((m) => m.id === report.modelId);
  const hw = report.hardware;
  const deviceLabel =
    hw?.gpuDevice && hw.gpuDevice !== "unknown"
      ? hw.gpuDevice
      : hw?.deviceClass && hw.deviceClass !== "unknown"
        ? hw.deviceClass
        : null;

  const selectedResult =
    report.questionResults.find((r) => r.questionId === selectedId) ?? null;
  const selectedQuestion = selectedResult
    ? QUESTIONS.find((q) => q.id === selectedResult.questionId) ?? null
    : null;

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <div className="flex flex-1 flex-col items-center px-6 py-12">
        <motion.div
          className="flex w-full max-w-2xl flex-col gap-10"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {/* header */}
          <motion.div variants={fadeUp} className="flex flex-col gap-1">
            <div className="mb-2 flex items-center justify-between">
              <button
                className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                onClick={() => router.push("/benchmark")}
              >
                ← back
              </button>
              {savedToDb && <ShareButton runId={runId} />}
            </div>
            <div className="flex items-center gap-3">
              {(() => {
                const logo = modelLogo(report.modelId);
                return logo ? (
                  <img src={logo} alt="" className="h-8 w-8 object-contain" />
                ) : null;
              })()}
              <h1 className="text-2xl font-medium tracking-tighter">benchmark report</h1>
            </div>
            <p className="text-xs text-muted-foreground">
              {report.modelDisplayName ?? model?.displayName ?? report.modelId}
              {model && (
                <span className="text-muted-foreground/50"> · {model.parameterCount} params</span>
              )}
              {" · "}
              {report.totalQuestions} questions
              {" · "}
              {new Date(report.completedAt).toLocaleString()}
            </p>
            {deviceLabel && (
              <p className="text-[10px] text-muted-foreground/40">
                {deviceLabel}
                {hw?.webgpuBackend && hw.webgpuBackend !== "unknown" && ` · ${hw.webgpuBackend}`}
                {hw?.browser && hw.browser !== "unknown" && ` · ${hw.browser}`}
                {hw?.os && hw.os !== "unknown" && ` · ${hw.os}`}
              </p>
            )}
          </motion.div>

{/* score hero */}
          <motion.div variants={fadeUp} className="flex flex-col gap-6">
            <div className="flex flex-col gap-1">
              <div className="flex items-baseline gap-2">
                <span className="text-6xl font-medium tracking-tight">{report.score}</span>
                <span className="text-xl text-muted-foreground/30">/ 1000</span>
              </div>
              <p className="text-xs text-muted-foreground/40">
                click a row to highlight those questions below
              </p>
            </div>

            <ScoreBreakdown
              questionResults={report.questionResults}
              totalQuestions={report.totalQuestions}
              activeDifficulty={activeDifficulty}
              onDifficultyClick={setActiveDifficulty}
            />
          </motion.div>

          {/* question dot grid */}
          <motion.div variants={fadeUp} className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground">questions</div>
              {activeDifficulty && (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onClick={() => setActiveDifficulty(null)}
                  className="text-[10px] text-muted-foreground/40 transition-colors hover:text-muted-foreground"
                >
                  show all
                </motion.button>
              )}
            </div>

            <div className="flex flex-wrap gap-1.5">
              {report.questionResults.map((r, i) => {
                const isDimmed = activeDifficulty !== null && r.difficulty !== activeDifficulty;
                const isSelected = selectedId === r.questionId;
                return (
                  <motion.button
                    key={r.questionId}
                    title={`${r.subject} · ${r.difficulty}`}
                    animate={{ opacity: isDimmed ? 0.1 : isSelected ? 1 : 0.4 }}
                    whileHover={{ opacity: isDimmed ? 0.1 : 1 }}
                    transition={{ duration: 0.15 }}
                    onClick={() => {
                      if (!isDimmed) {
                        setSelectedId((id) => (id === r.questionId ? null : r.questionId));
                      }
                    }}
                    className={`flex h-7 w-7 items-center justify-center border font-mono text-[10px] transition-transform duration-150 ${
                      r.correct
                        ? "border-green-500/40 text-green-500"
                        : "border-red-500/40 text-red-500"
                    } ${isSelected ? "scale-110 bg-foreground/5" : ""}`}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </motion.button>
                );
              })}
            </div>

            {/* expandable detail panel */}
            <AnimatePresence>
              {selectedResult && selectedQuestion && (
                <motion.div
                  key={selectedResult.questionId}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <div className="flex flex-col gap-5 border-t pt-5">
                    <div className="flex items-center text-[10px] uppercase tracking-widest text-muted-foreground/40">
                      <span>
                        {selectedResult.subject} · {selectedResult.difficulty}
                      </span>
                      <span className="ml-auto">
                        {selectedResult.correct ? (
                          <span className="text-green-600">correct</span>
                        ) : (
                          <span className="text-red-600">
                            answered {selectedResult.extractedAnswer || "—"} · expected{" "}
                            {selectedResult.expectedAnswer}
                          </span>
                        )}
                      </span>
                    </div>

                    <div className="text-sm leading-relaxed text-foreground/70">
                      <QuestionText
                        text={selectedQuestion.text}
                        choices={selectedQuestion.choices}
                        highlightCorrect={
                          selectedResult.expectedAnswer as "A" | "B" | "C" | "D"
                        }
                        highlightSelected={
                          selectedResult.extractedAnswer as
                            | "A"
                            | "B"
                            | "C"
                            | "D"
                            | undefined
                        }
                      />
                    </div>

                    {selectedResult.modelResponse && (
                      <ReasoningLog text={selectedResult.modelResponse} />
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* CTA for visitors who clicked a shared link */}
          {savedToDb && (
            <motion.div variants={fadeUp} className="border-t pt-6 text-center">
              <p className="mb-3 text-sm text-muted-foreground">
                run your own benchmark — entirely in your browser
              </p>
              <a
                href="/benchmark"
                className="inline-flex border px-5 py-2 text-sm transition-colors hover:bg-accent/50"
              >
                run benchmark →
              </a>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
