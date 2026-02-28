"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useBenchmarkStore } from "@/store/benchmark-store";
import { loadModel } from "@/lib/webllm/engine-client";
import { runQABenchmark } from "@/lib/benchmark/qa-runner";
import { ModelSelector } from "@/components/benchmark/ModelSelector";
import { BenchmarkControls } from "@/components/benchmark/BenchmarkControls";
import { SuiteSelector } from "@/components/benchmark/SuiteSelector";
import { LoadingOverlay } from "@/components/benchmark/LoadingOverlay";
import { BenchmarkProgress } from "@/components/benchmark/BenchmarkProgress";
import { Navbar } from "@/components/landing/Navbar";

export default function BenchmarkPage() {
  const router = useRouter();
  const { phase, error, selectedModelId, selectedSuiteId } = useBenchmarkStore();

  const handleRun = useCallback(async () => {
    const store = useBenchmarkStore.getState();
    const runId = `run-${Date.now()}`;

    try {
      store.startLoading();
      await loadModel(selectedModelId, (report) => {
        useBenchmarkStore.getState().setLoadingProgress(
          report.progress,
          report.text
        );
      });

      await runQABenchmark(selectedModelId, selectedSuiteId, runId);
      router.push(`/report/${runId}`);
    } catch (err) {
      useBenchmarkStore
        .getState()
        .setError(err instanceof Error ? err.message : String(err));
    }
  }, [selectedModelId, selectedSuiteId, router]);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <div className="flex flex-1 flex-col items-center px-6 py-12">
        <div className="flex w-full max-w-2xl flex-col gap-8">
          <div>
            <h1 className="text-2xl font-medium tracking-tighter">
              run benchmark
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              select a model and run the knowledge benchmark
            </p>
          </div>

          {phase === "idle" && (
            <>
              <ModelSelector />
              <SuiteSelector />
              <BenchmarkControls onRun={handleRun} />
            </>
          )}

          {phase === "loading-model" && <LoadingOverlay />}

          {phase === "running" && <BenchmarkProgress />}

          {phase === "error" && (
            <div className="flex flex-col gap-2 border border-destructive p-4">
              <div className="text-sm text-destructive">{error}</div>
              <button
                className="self-start border px-3 py-1 text-sm hover:bg-accent/50"
                onClick={() => useBenchmarkStore.getState().reset()}
              >
                try again
              </button>
            </div>
          )}

          {phase === "complete" && (
            <div className="text-sm text-muted-foreground">
              redirecting to report...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
