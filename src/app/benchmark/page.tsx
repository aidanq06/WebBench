"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useBenchmarkStore } from "@/store/benchmark-store";
import { loadModel } from "@/lib/webllm/engine-client";
import { runQABenchmark } from "@/lib/benchmark/qa-runner";
import { runDemoBenchmark } from "@/lib/benchmark/demo-runner";
import { ModelSelector } from "@/components/benchmark/ModelSelector";
import { BenchmarkProgress } from "@/components/benchmark/BenchmarkProgress";
import { CompatibilityGate } from "@/components/benchmark/CompatibilityGate";
import { Navbar } from "@/components/landing/Navbar";
import { AVAILABLE_MODELS, modelLogo } from "@/lib/webllm/models";
import { detectHardware } from "@/lib/hardware/detect";
import { HardwareInfo } from "@/types/report";
import type { Subject, Difficulty } from "@/types/agent";

// ── Stage types ────────────────────────────────────────────────────────────────

type IdleStage = "select" | "configure";

const SUBJECTS: (Subject | "all")[] = ["all", "cs", "engineering", "math", "science"];
const DIFFICULTIES: (Difficulty | "all")[] = ["all", "easy", "medium", "hard"];

// ── Slide variants ─────────────────────────────────────────────────────────────

const slideVariants = {
  enter: (back: boolean) => ({ opacity: 0, x: back ? -24 : 24 }),
  center: { opacity: 1, x: 0 },
  exit: (back: boolean) => ({ opacity: 0, x: back ? 24 : -24 }),
};

// ── Inline option row ──────────────────────────────────────────────────────────

function OptionRow({
  label,
  options,
  active,
  onSelect,
}: {
  label: string;
  options: string[];
  active: string;
  onSelect: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground/30">{label}</p>
      <div className="flex flex-wrap items-center gap-0 text-sm">
        {options.map((opt, i) => (
          <span key={opt} className="flex items-center">
            {i > 0 && <span className="mx-2 text-muted-foreground/15"> · </span>}
            <button
              onClick={() => onSelect(opt)}
              className={`transition-colors duration-150 ${
                active === opt
                  ? "font-medium text-foreground"
                  : "text-muted-foreground/35 hover:text-muted-foreground"
              }`}
            >
              {opt}
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}

const DEMO_MODEL_ID = "Llama-3.2-3B-Instruct-q4f16_1-MLC";

// ── Main page ──────────────────────────────────────────────────────────────────

function BenchmarkPageInner({ isDemo = false }: { isDemo?: boolean }) {
  const router = useRouter();
  const {
    phase,
    error,
    selectedModelId,
    questionCount,
    subjectFilter,
    difficultyFilter,
    loadingProgress,
    loadingText,
    setQuestionCount,
    setSubjectFilter,
    setDifficultyFilter,
  } = useBenchmarkStore();

  const selectedModel = AVAILABLE_MODELS.find((m) => m.id === selectedModelId);
  const [hardware, setHardware] = useState<HardwareInfo | null>(null);
  const [idleStage, setIdleStage] = useState<IdleStage>("select");
  const [goingBack, setGoingBack] = useState(false);

  const demoStartedRef = useRef(false);

  useEffect(() => {
    if (phase === "complete") useBenchmarkStore.getState().reset();
    if (isDemo) useBenchmarkStore.getState().setModel(DEMO_MODEL_ID);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    detectHardware().then(setHardware);
  }, []);

  function handleModelSelect() {
    setGoingBack(false);
    setIdleStage("configure");
  }

  function handleBack() {
    setGoingBack(true);
    setIdleStage("select");
  }

  const handleRun = useCallback(async () => {
    const runId = crypto.randomUUID();
    try {
      if (isDemo) {
        await runDemoBenchmark(selectedModelId, runId);
      } else {
        const store = useBenchmarkStore.getState();
        store.startLoading();
        await loadModel(selectedModelId, (report) => {
          useBenchmarkStore.getState().setLoadingProgress(report.progress, report.text);
        });
        await runQABenchmark(selectedModelId, store.questionCount, runId);
      }
      router.push(`/report/${runId}`);
    } catch (err) {
      useBenchmarkStore.getState().setError(err instanceof Error ? err.message : String(err));
    }
  }, [selectedModelId, router, isDemo]);

  useEffect(() => {
    if (isDemo && phase === "idle" && !demoStartedRef.current) {
      demoStartedRef.current = true;
      setTimeout(() => handleRun(), 300);
    }
  }, [isDemo, phase, handleRun]);

  const logo = modelLogo(selectedModelId);

  if (phase === "running") {
    return (
      <div className="flex h-[80dvh] flex-col overflow-hidden">
        <Navbar />
        <div className="flex flex-1 flex-col items-center justify-center overflow-hidden px-6">
          <div className="relative flex w-full max-w-4xl flex-col">
            <BenchmarkProgress />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <div className="flex flex-1 flex-col items-center px-8 py-16">
        <div className="flex w-full max-w-2xl flex-col gap-10">

          {/* ── idle: two-stage animated flow ── */}
          {phase === "idle" && (
            <AnimatePresence mode="wait" custom={goingBack}>
              {idleStage === "select" ? (

                /* ── Stage 1: model selection ── */
                <motion.div
                  key="select"
                  custom={goingBack}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.22, ease: "easeOut" }}
                  className="flex flex-col gap-8"
                >
                  <div>
                    <h1 className="font-serif text-3xl font-medium tracking-tight">
                      select <span className="text-muted-foreground">a model</span>
                    </h1>
                    {hardware && (
                      <p className="mt-2 font-mono text-[10px] text-[--fg-subtle]">
                        {hardware.os !== "unknown" ? `your ${hardware.os}` : "your device"}
                        {hardware.webgpuBackend !== "unknown" && ` · ${hardware.webgpuBackend}`}
                        {hardware.browser !== "unknown" && ` · ${hardware.browser}`}
                      </p>
                    )}
                  </div>
                  <ModelSelector onSelect={handleModelSelect} hardware={hardware} />
                </motion.div>

              ) : (

                /* ── Stage 2: configure ── */
                <motion.div
                  key="configure"
                  custom={goingBack}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.22, ease: "easeOut" }}
                  className="flex flex-col gap-10"
                >
                  {/* header */}
                  <div className="flex items-center justify-between">
                    <button
                      onClick={handleBack}
                      className="text-sm text-[--fg-subtle] transition-colors hover:text-muted-foreground"
                    >
                      ← back
                    </button>
                    <div className="flex items-center gap-2">
                      {logo && <img src={logo} alt="" className="h-5 w-5 object-contain" />}
                      <span className="text-sm font-medium">{selectedModel?.displayName}</span>
                      {selectedModel && (
                        <span className="font-mono text-[10px] text-[--fg-subtle]">{selectedModel.parameterCount}</span>
                      )}
                    </div>
                  </div>

                  {/* count */}
                  <div className="flex flex-col gap-3">
                    <p className="font-mono text-[10px] uppercase tracking-widest text-[--fg-subtle]">questions</p>
                    <div className="flex items-center gap-0 text-sm">
                      {([
                        { n: 3,  label: "3 · quick" },
                        { n: 5,  label: "5"          },
                        { n: 10, label: "10 · full"  },
                      ] as const).map(({ n, label }, i) => (
                        <span key={n} className="flex items-center">
                          {i > 0 && <span className="mx-2 text-muted-foreground/15"> · </span>}
                          <button
                            onClick={() => setQuestionCount(n)}
                            className={`transition-colors duration-150 ${
                              questionCount === n
                                ? "font-medium text-foreground"
                                : "text-muted-foreground/35 hover:text-muted-foreground"
                            }`}
                          >
                            {label}
                          </button>
                        </span>
                      ))}
                    </div>
                    <p className="text-[10px] text-muted-foreground/25">
                      you can stop at any time — partial results are always valid
                    </p>
                  </div>

                  {/* subject */}
                  <OptionRow
                    label="subject"
                    options={SUBJECTS as string[]}
                    active={subjectFilter}
                    onSelect={(v) => setSubjectFilter(v as Subject | "all")}
                  />

                  {/* difficulty */}
                  <OptionRow
                    label="difficulty"
                    options={DIFFICULTIES as string[]}
                    active={difficultyFilter}
                    onSelect={(v) => setDifficultyFilter(v as Difficulty | "all")}
                  />

                  {/* run */}
                  <motion.button
                    onClick={handleRun}
                    whileTap={{ scale: 0.99 }}
                    className="w-full border bg-primary py-5 text-base text-primary-foreground transition-colors hover:bg-primary/90"
                  >
                    run benchmark
                  </motion.button>
                </motion.div>

              )}
            </AnimatePresence>
          )}

          {/* ── loading ── */}
          {phase === "loading-model" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-5">
              <div className="text-base">
                loading{" "}
                <span className="text-muted-foreground">{selectedModel?.displayName ?? selectedModelId}</span>
                ...
              </div>
              <div className="relative h-1 w-full bg-secondary">
                <motion.div
                  className="absolute inset-y-0 left-0 bg-foreground"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.round(loadingProgress * 100)}%` }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{loadingText}</span>
                <span className="text-sm text-muted-foreground">{Math.round(loadingProgress * 100)}%</span>
              </div>
            </motion.div>
          )}

          {/* ── error ── */}
          {phase === "error" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-3 border border-destructive p-5">
              <div className="text-xs text-muted-foreground">error</div>
              <div className="text-sm text-destructive">{error}</div>
              <button
                className="self-start border px-3 py-1.5 text-sm hover:bg-accent/50"
                onClick={() => useBenchmarkStore.getState().reset()}
              >
                try again
              </button>
            </motion.div>
          )}

          {/* ── complete ── */}
          {phase === "complete" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-muted-foreground">
              redirecting to report...
            </motion.div>
          )}

        </div>
      </div>
    </div>
  );
}

function BenchmarkPageWithDemo() {
  const searchParams = useSearchParams();
  const isDemo = searchParams.get("demo") === "true";
  return (
    <CompatibilityGate bypass={isDemo}>
      <BenchmarkPageInner isDemo={isDemo} />
    </CompatibilityGate>
  );
}

export default function BenchmarkPage() {
  return (
    <Suspense>
      <BenchmarkPageWithDemo />
    </Suspense>
  );
}
