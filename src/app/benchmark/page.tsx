"use client";

import { useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useBenchmarkStore } from "@/store/benchmark-store";
import { loadModel } from "@/lib/webllm/engine-client";
import { runBenchmark } from "@/lib/benchmark/runner";
import { ModelSelector } from "@/components/benchmark/ModelSelector";
import { BenchmarkControls } from "@/components/benchmark/BenchmarkControls";
import { SuiteSelector } from "@/components/benchmark/SuiteSelector";
import { LoadingOverlay } from "@/components/benchmark/LoadingOverlay";
import { BenchmarkProgress } from "@/components/benchmark/BenchmarkProgress";
import { CustomerPortal } from "@/components/portal/CustomerPortal";
import { Navbar } from "@/components/landing/Navbar";

export default function BenchmarkPage() {
  const portalRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { phase, error, selectedModelId } = useBenchmarkStore();

  const handleRun = useCallback(async () => {
    const store = useBenchmarkStore.getState();

    try {
      store.startLoading();
      await loadModel(selectedModelId, (report) => {
        useBenchmarkStore.getState().setLoadingProgress(
          report.progress,
          report.text
        );
      });

      useBenchmarkStore.getState().startRunning();
      const report = await runBenchmark(portalRef);
      router.push(`/report/${report.runId}`);
    } catch (err) {
      useBenchmarkStore
        .getState()
        .setError(err instanceof Error ? err.message : "unknown error");
    }
  }, [selectedModelId, router]);

  const isRunning = phase === "running";

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <div className="flex flex-1 flex-col items-center px-6 py-12">
        <div className={`flex w-full flex-col gap-8 ${isRunning ? "max-w-4xl" : "max-w-2xl"}`}>
          <div>
            <h1 className="text-2xl font-medium tracking-tighter">
              run benchmark
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              select a model and run the task suite
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

          {phase === "running" && <BenchmarkProgress portalRef={portalRef} />}

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

      {/* portal: visible when running (embedded in BenchmarkProgress), hidden otherwise */}
      <div className={isRunning ? "hidden" : "pointer-events-none fixed left-0 top-0 opacity-0"}>
        <CustomerPortal ref={portalRef} />
      </div>
    </div>
  );
}
