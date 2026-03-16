"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useBenchmarkStore } from "@/store/benchmark-store";
import { loadModel } from "@/lib/webllm/engine-client";
import { runQABenchmark } from "@/lib/benchmark/qa-runner";
import { ModelSelector } from "@/components/benchmark/ModelSelector";
import { BenchmarkProgress } from "@/components/benchmark/BenchmarkProgress";
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

// ── Main page ──────────────────────────────────────────────────────────────────

export default function BenchmarkPage() {
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

  useEffect(() => {
    if (phase === "complete") useBenchmarkStore.getState().reset();
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
    const store = useBenchmarkStore.getState();
    const runId = `run-${Date.now()}`;
    try {
      store.startLoading();
      await loadModel(selectedModelId, (report) => {
        useBenchmarkStore.getState().setLoadingProgress(report.progress, report.text);
      });
      await runQABenchmark(selectedModelId, store.questionCount, runId);
      router.push(`/report/${runId}`);
    } catch (err) {
      useBenchmarkStore.getState().setError(err instanceof Error ? err.message : String(err));
    }
  }, [selectedModelId, router]);

  const logo = modelLogo(selectedModelId);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <div className="flex flex-1 flex-col items-center px-6 py-12">
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
                    <h1 className="text-4xl font-medium tracking-tighter">select a model</h1>
                    {hardware && (
                      <p className="mt-2 text-xs text-muted-foreground/50">
                        detected:{" "}
                        {hardware.gpuDevice !== "unknown" ? hardware.gpuDevice : hardware.deviceClass !== "unknown" ? hardware.deviceClass : "unknown device"}
                        {hardware.webgpuBackend !== "unknown" && ` · ${hardware.webgpuBackend}`}
                        {hardware.browser !== "unknown" && ` · ${hardware.browser}`}
                      </p>
                    )}
                  </div>
                  <ModelSelector onSelect={handleModelSelect} suggestedModelId={suggestedModelId} />
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
                    <motion.button
                      onClick={handleBack}
                      whileHover={{ x: -2 }}
                      transition={{ duration: 0.15 }}
                      className="text-sm text-muted-foreground/40 transition-colors hover:text-muted-foreground"
                    >
                      ← back
                    </motion.button>
                    <div className="flex items-center gap-2">
                      {logo && <img src={logo} alt="" className="h-5 w-5 object-contain" />}
                      <span className="text-sm font-medium">{selectedModel?.displayName}</span>
                      {selectedModel && (
                        <span className="text-xs text-muted-foreground/40">{selectedModel.parameterCount}</span>
                      )}
                    </div>
                  </div>

                  {/* count */}
                  <div className="flex flex-col gap-3">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground/30">count</p>
                    <div className="flex items-center gap-0 text-sm">
                      {([10, 20, 40] as const).map((n, i) => (
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
                            {n}
                          </button>
                        </span>
                      ))}
                    </div>
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

          {/* ── running ── */}
          {phase === "running" && <BenchmarkProgress />}

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
