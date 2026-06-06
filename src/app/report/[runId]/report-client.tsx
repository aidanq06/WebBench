"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { BenchmarkReport, SubjectScore } from "@/types/report";
import { QUESTIONS } from "@/lib/benchmark/questions";
import { QuestionText } from "@/components/benchmark/QuestionText";
import { Navbar } from "@/components/landing/Navbar";
import { AVAILABLE_MODELS, modelLogo } from "@/lib/webllm/models";
import { getLocalRuns } from "@/lib/storage/local-runs";
import { PUBLISHED_BASELINES, getNearestBaselines } from "@/lib/benchmark/published-baselines";
import { EXTRACT_SOURCE_LABEL } from "@/lib/benchmark/answer-extractor";
import { EASE, DURATIONS } from "@/lib/motion";
import type { QuestionResult } from "@/types/task";

const EASE_OUT_EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1];

function hardwareLabel(os: string): string {
  if (os === "macos") return "your Mac";
  if (os === "windows") return "your Windows laptop";
  if (os === "linux") return "your Linux machine";
  if (os === "android") return "your Android device";
  if (os === "ios") return "your iPhone";
  return "your device";
}

function ShareButton({ runId }: { runId: string }) {
  const [copied, setCopied] = useState(false);
  async function handleShare() {
    await navigator.clipboard.writeText(`${window.location.origin}/report/${runId}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <button
      onClick={handleShare}
      className="text-xs text-muted-foreground transition-colors hover:text-foreground"
    >
      {copied ? <span className="text-[--success]">copied ✓</span> : "share"}
    </button>
  );
}

// Renders the raw model output exactly as the stream produced it — no slicing,
// no formatting. This is the whole point of the wrap-up: show what the model
// actually did, including any ANSWER: line or junk after it.
function RawOutput({ text }: { text: string }) {
  const clean = text.replace(/<\/?think>/gi, "").trim();
  return (
    <pre className="whitespace-pre-wrap text-xs leading-relaxed text-muted-foreground/80 font-mono">
      {clean || <span className="italic text-[--fg-subtle]">empty</span>}
    </pre>
  );
}

function SubjectBreakdown({ subjectScores }: { subjectScores: SubjectScore[] }) {
  const visible = subjectScores.filter((s) => s.total > 0);
  if (visible.length === 0) return null;
  return (
    <div className="flex flex-col gap-1">
      {visible.map((s, i) => (
        <div key={s.subject} className="flex items-center gap-4 py-2">
          <span className="w-20 shrink-0 text-xs text-muted-foreground">{s.subject}</span>
          <div className="relative h-px flex-1 bg-secondary">
            <motion.div
              className="absolute inset-y-0 left-0 bg-foreground"
              initial={{ width: 0 }}
              animate={{ width: `${s.accuracy * 100}%` }}
              transition={{ duration: 0.65, delay: i * 0.07, ease: "easeOut" }}
            />
          </div>
          <span className="w-10 shrink-0 text-right font-mono text-[10px] tabular-nums text-[--fg-subtle]">
            {s.correct}/{s.total}
          </span>
          <span className="w-12 shrink-0 text-right font-mono text-sm tabular-nums">
            {Math.round(s.accuracy * 100)}
            <span className="text-[10px] text-muted-foreground/40">%</span>
          </span>
        </div>
      ))}
    </div>
  );
}

function QuestionRow({ index, result }: { index: number; result: QuestionResult }) {
  const [open, setOpen] = useState(false);
  const question = QUESTIONS.find((q) => q.id === result.questionId) ?? null;
  const timeS = (result.timeTakenMs / 1000).toFixed(1);

  return (
    <div className="border-b border-[--border] last:border-b-0">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 py-3 text-left transition-colors hover:bg-foreground/[0.02]"
      >
        <span className="font-mono text-[10px] text-[--fg-subtle] w-6 shrink-0">
          {open ? "▼" : "▶"}
        </span>
        <span className="font-mono text-[10px] text-[--fg-subtle] w-6 shrink-0">
          Q{index + 1}
        </span>
        <span className="font-mono text-[10px] text-[--fg-subtle]">{result.subject}</span>
        <span className="font-mono text-[10px] text-[--fg-subtle]">·</span>
        <span className="font-mono text-[10px] text-[--fg-subtle]">{result.difficulty}</span>
        <span className="font-mono text-[10px] text-[--fg-subtle]">·</span>
        <span className={`font-mono text-[10px] ${result.correct ? "text-[--success]" : "text-destructive"}`}>
          {result.correct ? "✓" : "✗"}
        </span>
        <span className="font-mono text-[10px] text-[--fg-subtle]">·</span>
        <span className="font-mono text-[10px] text-[--fg-subtle]">{timeS}s</span>
        <span className="font-mono text-[10px] text-[--fg-subtle]">·</span>
        <span className="font-mono text-[10px] text-[--fg-subtle]">
          {result.extractedAnswer || "—"}
        </span>
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
            <div className="flex flex-col gap-4 pb-5 pl-12">
              <p className="font-mono text-[10px] text-[--fg-subtle]">
                {result.extractedAnswer
                  ? `answered ${result.extractedAnswer}`
                  : "no answer extracted"}{" "}
                · expected {result.expectedAnswer} · parsed via{" "}
                <span className="text-muted-foreground">
                  {EXTRACT_SOURCE_LABEL[result.extractionSource]}
                </span>
              </p>
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
              {result.modelResponse && (
                <div className="flex flex-col gap-2">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-[--fg-subtle]">
                    raw model output
                  </span>
                  <div className="max-h-80 overflow-y-auto border border-[--border] p-3 [&::-webkit-scrollbar]:w-[3px] [&::-webkit-scrollbar-thumb]:bg-[--border]">
                    <RawOutput text={result.modelResponse} />
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PublishedReference({ report }: { report: BenchmarkReport }) {
  const modelDisplayName = (report.modelDisplayName ?? "").toLowerCase();
  const exactMatch = PUBLISHED_BASELINES.find((b) => {
    const bn = b.name.toLowerCase();
    return (
      (modelDisplayName.includes("llama 3.2 3b") && bn.includes("3.2 3b")) ||
      (modelDisplayName.includes("llama 3.2 1b") && bn.includes("3.2 1b")) ||
      (modelDisplayName.includes("gemma 2 2b") && bn.includes("gemma 2 2b")) ||
      (modelDisplayName.includes("phi 3.5") && bn.includes("phi-3.5")) ||
      (modelDisplayName.includes("mistral 7b") && bn.includes("mistral 7b"))
    );
  });
  const nearest = exactMatch ?? getNearestBaselines(report.overallAccuracy)[0];
  if (!nearest) return null;
  const ci = report.confidenceInterval;
  const agreesCi = ci !== null && nearest.accuracy >= ci.lower && nearest.accuracy <= ci.upper;
  return (
    <p className="font-mono text-[10px] text-[--fg-subtle]">
      published reference ({nearest.name}): {Math.round(nearest.accuracy * 100)}%
      {ci && (
        <span className={agreesCi ? " text-[--success]" : " text-destructive/70"}>
          {agreesCi ? "  ·  your run agrees within CI ✓" : "  ·  outside CI"}
        </span>
      )}
    </p>
  );
}

const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: DURATIONS.base, ease: EASE } },
};

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
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (!report) {
      // Prefer the immediate-redirect copy, then fall back to saved local runs —
      // a run may live only in localStorage (e.g. never reached the DB, or the
      // DB was wiped), which is exactly what "your last run" links point at.
      const stored = sessionStorage.getItem(`report-${runId}`);
      if (stored) {
        setReport(JSON.parse(stored));
        return;
      }
      const local = getLocalRuns().find((r) => r.runId === runId);
      if (local) setReport(local);
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
  const osLabel = hw?.os && hw.os !== "unknown" ? hardwareLabel(hw.os) : null;
  const ci = report.confidenceInterval;
  const ciLo = ci ? Math.round(ci.lower * 100) : null;
  const ciHi = ci ? Math.round(ci.upper * 100) : null;
  const noAnswerCount = report.questionResults.filter((r) => !r.extractedAnswer).length;

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <div className="flex flex-1 flex-col items-center px-8 py-12">
        <motion.div
          className="flex w-full max-w-2xl flex-col gap-10"
          variants={staggerContainer}
          initial="hidden"
          animate="show"
        >
          <motion.div variants={item} className="flex items-center justify-between">
            <button
              className="text-xs text-[--fg-subtle] transition-colors hover:text-muted-foreground"
              onClick={() => router.push("/benchmark")}
            >
              ← benchmark
            </button>
            <div className="flex items-center gap-4 text-xs text-[--fg-subtle]">
              <ShareButton runId={runId} />
              <button
                className="transition-colors hover:text-foreground"
                onClick={() => router.push("/benchmark")}
              >
                re-run
              </button>
            </div>
          </motion.div>

          <motion.div variants={item} className="flex items-center gap-3">
            {(() => {
              const logo = modelLogo(report.modelId);
              return logo ? <img src={logo} alt="" className="h-6 w-6 object-contain" /> : null;
            })()}
            <span className="font-mono text-sm font-medium uppercase tracking-wider">
              {report.modelDisplayName ?? model?.displayName ?? report.modelId}
            </span>
            {model && (
              <span className="font-mono text-[10px] text-[--fg-subtle]">
                {model.parameterCount}
              </span>
            )}
            {osLabel && (
              <>
                <span className="font-mono text-[10px] text-[--fg-subtle]">·</span>
                <span className="font-mono text-[10px] text-[--fg-subtle]">
                  ran on {osLabel}
                </span>
              </>
            )}
          </motion.div>

          <motion.div variants={item} className="flex flex-col items-center gap-2 py-6">
            <span className="font-mono text-[10px] uppercase tracking-widest text-[--fg-subtle]">
              Accuracy
            </span>
            <span className="font-serif text-7xl font-medium tabular-nums leading-none">
              {report.score}<span className="text-3xl text-muted-foreground/40">%</span>
            </span>
            <p className="text-xs text-[--fg-subtle]">
              {report.correctCount}/{report.totalQuestions} correct
              {ciLo !== null && ciHi !== null && (
                <span className="ml-2 text-[--fg-subtle]/70">
                  · 95% CI {ciLo}–{ciHi}%
                </span>
              )}
            </p>
            {noAnswerCount > 0 && (
              <p className="text-[10px] text-[--fg-subtle]">
                {noAnswerCount} of {report.totalQuestions} produced no extractable answer
              </p>
            )}
          </motion.div>

          <motion.div variants={item} className="flex justify-center">
            <button
              onClick={() => setShowDetails((d) => !d)}
              className="font-mono text-xs text-[--fg-subtle] transition-colors hover:text-foreground"
            >
              {showDetails ? "hide details ↑" : "show details ↓"}
            </button>
          </motion.div>

          <AnimatePresence initial={false}>
            {showDetails && (
              <motion.div
                key="details"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
                className="overflow-hidden"
              >
                <div className="flex flex-col gap-10 pt-2">
                  <PublishedReference report={report} />

                  {report.subjectScores && report.subjectScores.length > 0 && (
                    <div className="flex flex-col gap-4">
                      <span className="font-mono text-[10px] uppercase tracking-widest text-[--fg-subtle]">
                        subject breakdown
                      </span>
                      <SubjectBreakdown subjectScores={report.subjectScores} />
                    </div>
                  )}

                  <div className="flex flex-col gap-4">
                    <div className="flex items-baseline justify-between">
                      <span className="font-mono text-[10px] uppercase tracking-widest text-[--fg-subtle]">
                        questions
                      </span>
                      <span className="font-serif text-sm text-muted-foreground italic">
                        see what the model actually wrote
                      </span>
                    </div>
                    <div className="flex flex-col">
                      {report.questionResults.map((result, i) => (
                        <QuestionRow key={result.questionId} index={i} result={result} />
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <p className="font-mono text-[10px] text-[--fg-subtle]">
                      methodology: 5-shot MMLU · Wilson 95% CI · layered answer extraction
                    </p>
                    <a
                      href="/methodology"
                      className="font-mono text-[10px] text-[--fg-subtle] transition-colors hover:text-muted-foreground"
                    >
                      read full methodology →
                    </a>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {savedToDb && (
            <motion.div variants={item} className="border-t border-[--border] pt-6 text-center">
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
