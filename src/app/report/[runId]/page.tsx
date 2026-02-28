"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { BenchmarkReport } from "@/types/report";
import { QuestionResult } from "@/types/task";
import { QUESTION_SUITES, QUESTIONS } from "@/lib/benchmark/questions";
import { ScoreGauge } from "@/components/report/ScoreGauge";
import { QuestionText } from "@/components/benchmark/QuestionText";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/landing/Navbar";
import { AVAILABLE_MODELS } from "@/lib/webllm/models";

// ── Animated stat bar ───────────────────────────────────────────────────────
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
      <div className="relative h-1.5 flex-1 bg-secondary">
        <motion.div
          className={`absolute inset-y-0 left-0 ${pct >= 50 ? "bg-green-600" : "bg-red-600"}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, delay, ease: "easeOut" }}
        />
      </div>
      <span className="w-16 shrink-0 text-right text-xs text-muted-foreground">
        {correct}/{total}
      </span>
    </div>
  );
}

// ── Expandable question result row ──────────────────────────────────────────
function QuestionRow({ result }: { result: QuestionResult }) {
  const [open, setOpen] = useState(false);
  const question = QUESTIONS.find((q) => q.id === result.questionId);

  return (
    <div className={`border-b last:border-b-0 ${open ? "border-l-2 border-l-muted-foreground/30" : ""}`}>
      <button
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-accent/20"
        onClick={() => setOpen((v) => !v)}
      >
        {/* status dot */}
        <motion.div
          className={`h-2 w-2 shrink-0 rounded-full ${result.correct ? "bg-green-600" : "bg-red-600"}`}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300 }}
        />
        <span className="w-8 shrink-0 font-mono text-xs text-muted-foreground/60">
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
        <span className="shrink-0 text-xs text-muted-foreground/50">
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
              {/* question text with LaTeX */}
              {question && (
                <div className="text-sm leading-relaxed text-foreground/70">
                  <QuestionText text={question.text} />
                </div>
              )}

              {/* extracted vs expected */}
              <div className="flex gap-6 text-xs text-muted-foreground">
                <span>
                  extracted:{" "}
                  <span className={`font-mono ${result.correct ? "text-green-600" : "text-red-600"}`}>
                    {result.extractedAnswer || "(none)"}
                  </span>
                </span>
                <span>
                  expected:{" "}
                  <span className="font-mono text-foreground/60">{result.expectedAnswer}</span>
                </span>
              </div>

              {/* full model response */}
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

// ── Stagger container ────────────────────────────────────────────────────────
const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
};

// ── Page ─────────────────────────────────────────────────────────────────────
export default function ReportPage() {
  const params = useParams();
  const router = useRouter();
  const [report, setReport] = useState<BenchmarkReport | null>(null);

  useEffect(() => {
    const runId = params.runId as string;
    const stored = sessionStorage.getItem(`report-${runId}`);
    if (stored) {
      setReport(JSON.parse(stored));
    }
  }, [params.runId]);

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

  const suite = QUESTION_SUITES.find((s) => s.id === report.suiteId);
  const model = AVAILABLE_MODELS.find((m) => m.id === report.modelId);
  const accuracy = Math.round(report.overallAccuracy * 100);

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
          {/* ── header ── */}
          <motion.div variants={fadeUp} className="flex flex-col gap-1">
            <button
              className="mb-1 self-start text-xs text-muted-foreground transition-colors hover:text-foreground"
              onClick={() => router.push("/benchmark")}
            >
              ← back
            </button>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-medium tracking-tighter">benchmark report</h1>
              {suite && (
                <Badge variant="secondary" className="text-xs">
                  {suite.name}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {model?.displayName ?? report.modelId} ·{" "}
              {new Date(report.completedAt).toLocaleString()}
            </p>
          </motion.div>

          {/* ── score + stats row ── */}
          <motion.div variants={fadeUp} className="grid grid-cols-3 gap-px border">
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
              <span className="text-3xl font-medium tracking-tight">
                {(report.avgTimeMs / 1000).toFixed(1)}s
              </span>
              <span className="text-xs text-muted-foreground">avg per question</span>
            </div>
          </motion.div>

          {/* ── subject breakdown ── */}
          <motion.div variants={fadeUp} className="flex flex-col gap-3">
            <div className="text-xs text-muted-foreground">by subject</div>
            <div className="flex flex-col gap-2">
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

          {/* ── difficulty breakdown ── */}
          <motion.div variants={fadeUp} className="flex flex-col gap-3">
            <div className="text-xs text-muted-foreground">by difficulty</div>
            <div className="flex flex-col gap-2">
              {report.difficultyScores.map((s, i) => (
                <StatBar
                  key={s.difficulty}
                  label={s.difficulty}
                  correct={s.correct}
                  total={s.total}
                  delay={i * 0.08}
                />
              ))}
            </div>
          </motion.div>

          {/* ── question results ── */}
          <motion.div variants={fadeUp} className="flex flex-col gap-2">
            <div className="text-xs text-muted-foreground">questions</div>
            <div className="border">
              {report.questionResults.map((result) => (
                <QuestionRow key={result.questionId} result={result} />
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
