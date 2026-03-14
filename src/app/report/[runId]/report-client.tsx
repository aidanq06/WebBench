"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Share2, Check } from "lucide-react";
import { BenchmarkReport } from "@/types/report";
import { QuestionResult } from "@/types/task";
import { QUESTIONS } from "@/lib/benchmark/questions";
import { ScoreGauge } from "@/components/report/ScoreGauge";
import { QuestionText } from "@/components/benchmark/QuestionText";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/landing/Navbar";
import { AVAILABLE_MODELS, modelLogo } from "@/lib/webllm/models";

// ── Animated stat bar ─────────────────────────────────────────────────────────
function StatBar({
  label,
  correct,
  total,
  delay = 0,
}: {
  label: string;
  correct: number;
  total: number;
  delay?: number;
}) {
  const pct = total > 0 ? (correct / total) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-20 shrink-0 text-xs text-muted-foreground">{label}</span>
      <div className="relative h-0.5 flex-1 bg-secondary">
        <motion.div
          className="absolute inset-y-0 left-0 bg-foreground"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, delay, ease: "easeOut" }}
        />
      </div>
      <span className="w-12 shrink-0 text-right text-xs text-muted-foreground">
        {correct}/{total}
      </span>
    </div>
  );
}

// ── Difficulty block ──────────────────────────────────────────────────────────
function DifficultyBlock({
  label,
  correct,
  total,
  delay = 0,
}: {
  label: string;
  correct: number;
  total: number;
  delay?: number;
}) {
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: "easeOut" }}
      className="flex flex-1 flex-col items-center gap-1 border p-5"
    >
      <span className="text-3xl font-medium tracking-tight">{pct}%</span>
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-[10px] text-muted-foreground/50">{correct}/{total}</span>
    </motion.div>
  );
}

// ── Expandable question row ───────────────────────────────────────────────────
function QuestionRow({ result }: { result: QuestionResult }) {
  const [open, setOpen] = useState(false);
  const question = QUESTIONS.find((q) => q.id === result.questionId);

  return (
    <div className={`border-b last:border-b-0 ${open ? "border-l-2 border-l-muted-foreground/20" : ""}`}>
      <button
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-accent/20"
        onClick={() => setOpen((v) => !v)}
      >
        <motion.div
          className={`h-1.5 w-1.5 shrink-0 ${result.correct ? "bg-green-600" : "bg-red-600"}`}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300 }}
        />
        <span className="w-8 shrink-0 font-mono text-xs text-muted-foreground/50">
          {result.questionId}
        </span>
        <Badge variant="secondary" className="shrink-0 text-[10px]">
          {result.subject}
        </Badge>
        <Badge variant="outline" className="shrink-0 text-[10px]">
          {result.difficulty}
        </Badge>
        <span className={`flex-1 text-xs ${result.correct ? "text-foreground/70" : "text-muted-foreground"}`}>
          {result.correct ? "correct" : "incorrect"}
        </span>
        <span className="shrink-0 text-xs text-muted-foreground/40">
          {(result.timeTakenMs / 1000).toFixed(1)}s
        </span>
        <motion.span
          animate={{ rotate: open ? 90 : 0 }}
          transition={{ duration: 0.2 }}
          className="shrink-0 text-[10px] text-muted-foreground/40"
        >
          ›
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="detail"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-4 px-6 pb-5 pt-2">
              {question && (
                <div className="text-sm leading-relaxed text-foreground/70">
                  <QuestionText
                    text={question.text}
                    choices={question.choices}
                    highlightCorrect={result.expectedAnswer as "A" | "B" | "C" | "D"}
                    highlightSelected={result.extractedAnswer as "A" | "B" | "C" | "D" | undefined}
                  />
                </div>
              )}
              <div className="flex gap-6 text-xs text-muted-foreground">
                <span>
                  answered:{" "}
                  <span className={`font-mono ${result.correct ? "text-green-600" : "text-red-600"}`}>
                    {result.extractedAnswer || "(none)"}
                  </span>
                </span>
                <span>
                  correct:{" "}
                  <span className="font-mono text-foreground/60">{result.expectedAnswer}</span>
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-muted-foreground">model response</span>
                <pre className="max-h-64 overflow-y-auto whitespace-pre-wrap bg-secondary px-3 py-3 text-xs text-muted-foreground/80">
                  {result.modelResponse || "(no response)"}
                </pre>
              </div>
            </div>
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
      className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
    >
      {copied ? (
        <>
          <Check className="h-3 w-3 text-green-600" />
          <span className="text-green-600">copied</span>
        </>
      ) : (
        <>
          <Share2 className="h-3 w-3" />
          share
        </>
      )}
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
  speedPercentile,
}: {
  runId: string;
  dbReport: BenchmarkReport | null;
  savedToDb: boolean;
  speedPercentile: number | null;
}) {
  const router = useRouter();
  const [report, setReport] = useState<BenchmarkReport | null>(dbReport);

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
  const accuracy = Math.round(report.overallAccuracy * 100);
  const hw = report.hardware;
  const deviceLabel = hw?.gpuDevice && hw.gpuDevice !== "unknown"
    ? hw.gpuDevice
    : hw?.deviceClass && hw.deviceClass !== "unknown"
      ? hw.deviceClass
      : null;

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <div className="flex flex-1 flex-col items-center px-6 py-12">
        <motion.div
          className="flex w-full max-w-2xl flex-col gap-8"
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

          {/* sign-in prompt for unsigned users */}
          {!savedToDb && (
            <motion.div
              variants={fadeUp}
              className="flex items-center justify-between border border-dashed px-4 py-3"
            >
              <p className="text-xs text-muted-foreground">
                sign in to save and share this report permanently
              </p>
              <a
                href={`/benchmark`}
                className="text-xs text-foreground underline-offset-2 hover:underline"
              >
                sign in
              </a>
            </motion.div>
          )}

          {/* score + stats row */}
          <motion.div variants={fadeUp} className="grid grid-cols-2 gap-px border sm:grid-cols-4">
            <div className="flex flex-col items-center gap-1 bg-background p-6">
              <ScoreGauge score={accuracy} />
              <span className="text-xs text-muted-foreground">accuracy</span>
            </div>
            <div className="flex flex-col items-center justify-center gap-1 bg-background p-6">
              <span className="text-3xl font-medium tracking-tight">
                {report.correctCount}/{report.totalQuestions}
              </span>
              <span className="text-xs text-muted-foreground">correct</span>
            </div>
            <div className="flex flex-col items-center justify-center gap-1 bg-background p-6">
              {report.tokensPerSecond > 0 ? (
                <>
                  <span className="text-3xl font-medium tracking-tight">
                    {report.tokensPerSecond.toFixed(1)}
                  </span>
                  <span className="text-xs text-muted-foreground">tok/s</span>
                  {speedPercentile !== null && (
                    <span className="text-[10px] text-muted-foreground/50">
                      faster than {speedPercentile}%
                    </span>
                  )}
                </>
              ) : (
                <>
                  <span className="text-3xl font-medium tracking-tight">—</span>
                  <span className="text-xs text-muted-foreground">tok/s</span>
                </>
              )}
            </div>
            <div className="flex flex-col items-center justify-center gap-1 bg-background p-6">
              {report.efficiencyScore > 0 ? (
                <>
                  <span className="text-3xl font-medium tracking-tight">
                    {report.efficiencyScore.toFixed(1)}
                  </span>
                  <span className="text-xs text-muted-foreground">efficiency</span>
                  <span className="text-[10px] text-muted-foreground/50">acc% ÷ √params</span>
                </>
              ) : (
                <>
                  <span className="text-3xl font-medium tracking-tight">—</span>
                  <span className="text-xs text-muted-foreground">efficiency</span>
                </>
              )}
            </div>
          </motion.div>

          {/* difficulty curve */}
          <motion.div variants={fadeUp} className="flex flex-col gap-3">
            <div className="text-xs text-muted-foreground">difficulty curve</div>
            <div className="flex gap-2">
              {report.difficultyScores.map((s, i) => (
                <DifficultyBlock
                  key={s.difficulty}
                  label={s.difficulty}
                  correct={s.correct}
                  total={s.total}
                  delay={i * 0.08}
                />
              ))}
            </div>
          </motion.div>

          {/* subject breakdown */}
          <motion.div variants={fadeUp} className="flex flex-col gap-3">
            <div className="text-xs text-muted-foreground">by subject</div>
            <div className="flex flex-col gap-2.5">
              {report.subjectScores.map((s, i) => (
                <StatBar
                  key={s.subject}
                  label={s.subject}
                  correct={s.correct}
                  total={s.total}
                  delay={i * 0.08}
                />
              ))}
            </div>
          </motion.div>

          {/* question results */}
          <motion.div variants={fadeUp} className="flex flex-col gap-2">
            <div className="text-xs text-muted-foreground">questions</div>
            <div className="border">
              {report.questionResults.map((result) => (
                <QuestionRow key={result.questionId} result={result} />
              ))}
            </div>
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
