"use client";

import { useBenchmarkStore } from "@/store/benchmark-store";
import { AVAILABLE_MODELS } from "@/lib/webllm/models";

export function ModelSelector() {
  const { selectedModelId, setModel } = useBenchmarkStore();

  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs text-muted-foreground">model</label>
      <div className="flex gap-2">
        {AVAILABLE_MODELS.map((model) => (
          <button
            key={model.id}
            className={`border px-4 py-2 text-sm hover:bg-accent/50 ${
              selectedModelId === model.id
                ? "bg-accent text-accent-foreground"
                : ""
            }`}
            onClick={() => setModel(model.id)}
          >
            <div>{model.displayName}</div>
            <div className="text-xs text-muted-foreground">
              {model.parameterCount} · ~{model.estimatedSizeMB}mb
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
