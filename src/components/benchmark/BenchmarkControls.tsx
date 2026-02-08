"use client";

import { useBenchmarkStore } from "@/store/benchmark-store";

export function BenchmarkControls({ onRun }: { onRun: () => void }) {
  const { config, setConfig, phase } = useBenchmarkStore();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label className="text-xs text-muted-foreground">
          max steps per task: {config.maxSteps}
        </label>
        <input
          type="range"
          min={5}
          max={30}
          value={config.maxSteps}
          onChange={(e) => setConfig({ maxSteps: Number(e.target.value) })}
          className="w-48"
        />
      </div>

      <button
        className="border bg-primary px-6 py-3 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        onClick={onRun}
        disabled={phase !== "idle"}
      >
        run benchmark
      </button>
    </div>
  );
}
