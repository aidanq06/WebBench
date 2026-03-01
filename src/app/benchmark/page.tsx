"use client";

import { useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useBenchmarkStore } from "@/store/benchmark-store";
import { loadModel } from "@/lib/webllm/engine-client";
import { runQABenchmark } from "@/lib/benchmark/qa-runner";
import { ModelSelector } from "@/components/benchmark/ModelSelector";
import { BenchmarkProgress } from "@/components/benchmark/BenchmarkProgress";
import { Navbar } from "@/components/landing/Navbar";
import { AVAILABLE_MODELS } from "@/lib/webllm/models";

const fadeUp = {
  hidden: { opacity: 0, y: 8 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, delay: i * 0.1, ease: "easeOut" as const },
  }),
};

export default function BenchmarkPage() {
  const router = useRouter();
  const {
    phase,
    error,
    selectedModelId,
    questionCount,
    loadingProgress,
    loadingText,
    setQuestionCount,
  } = useBenchmarkStore();

  const selectedModel = AVAILABLE_MODELS.find((m) => m.id === selectedModelId);

  // Reset if we navigated back after a completed run
  useEffect(() => {
    if (phase === "complete") {
      useBenchmarkStore.getState().reset();
    }
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

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
      useBenchmarkStore
        .getState()
        .setError(err instanceof Error ? err.message : String(err));
    }
  }, [selectedModelId, router]);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <div className="flex flex-1 flex-col items-center px-6 py-12">
        <div className="flex w-full max-w-2xl flex-col gap-10">

          {/* ── idle ── */}
          {phase === "idle" && (
            <>
              <motion.div custom={0} variants={fadeUp} initial="hidden" animate="show">
                <h1 className="text-4xl font-medium tracking-tighter">run benchmark</h1>
                <p className="mt-3 text-base text-muted-foreground">
                  select a model and question count, then run
                </p>
              </motion.div>

              <motion.div custom={1} variants={fadeUp} initial="hidden" animate="show">
                <ModelSelector />
              </motion.div>

              <motion.div custom={2} variants={fadeUp} initial="hidden" animate="show" className="flex flex-col gap-3">
                <div className="text-sm text-muted-foreground">questions</div>
                <div className="flex gap-3">
                  {([10, 20, 40] as const).map((n) => {
                    const meta = {
                      10: { tag: "quick", hint: "~3 min" },
                      20: { tag: "standard", hint: "~6 min" },
                      40: { tag: "thorough", hint: "~12 min" },
                    }[n];
                    return (
                      <button
                        key={n}
                        onClick={() => setQuestionCount(n)}
                        className={`group relative flex-1 overflow-hidden border py-4 text-sm transition-colors hover:bg-accent/30 ${
                          questionCount === n ? "border-foreground/30 bg-accent" : ""
                        }`}
                      >
                        <span className="flex flex-col items-center gap-1 transition-opacity duration-150 group-hover:opacity-0">
                          <span className="text-xl font-medium">{n}</span>
                          <span className="text-xs text-muted-foreground">{meta.tag}</span>
                        </span>
                        <span className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                          <span className="font-medium">{n}</span>
                          <span className="text-xs text-muted-foreground">{meta.hint}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </motion.div>

              <motion.div custom={3} variants={fadeUp} initial="hidden" animate="show">
                <motion.button
                  onClick={handleRun}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="w-full border bg-primary py-5 text-base text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  run benchmark
                </motion.button>
              </motion.div>
            </>
          )}

          {/* ── loading ── */}
          {phase === "loading-model" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col gap-5"
            >
              <div className="text-base">
                loading{" "}
                <span className="text-muted-foreground">
                  {selectedModel?.displayName ?? selectedModelId}
                </span>
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
                <span className="text-sm text-muted-foreground">
                  {Math.round(loadingProgress * 100)}%
                </span>
              </div>
            </motion.div>
          )}

          {/* ── running ── */}
          {phase === "running" && <BenchmarkProgress />}

          {/* ── error ── */}
          {phase === "error" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col gap-3 border border-destructive p-5"
            >
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
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-muted-foreground"
            >
              redirecting to report...
            </motion.div>
          )}

        </div>
      </div>
    </div>
  );
}
