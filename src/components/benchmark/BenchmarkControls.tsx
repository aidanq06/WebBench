"use client";

import { useBenchmarkStore } from "@/store/benchmark-store";

export function BenchmarkControls({ onRun }: { onRun: () => void }) {
  const { phase } = useBenchmarkStore();

  return (
    <button
      className="border bg-primary px-6 py-3 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      onClick={onRun}
      disabled={phase !== "idle"}
    >
      run benchmark
    </button>
  );
}
