"use client";

import { useBenchmarkStore } from "@/store/benchmark-store";
import { AVAILABLE_MODELS } from "@/lib/webllm/models";

export function ModelSelector() {
  const { selectedModelId, setModel } = useBenchmarkStore();

  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs text-muted-foreground">model</label>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
        {AVAILABLE_MODELS.map((model) => (
          <button
            key={model.id}
            className={`border px-3 py-2 text-left text-sm hover:bg-accent/50 ${
              selectedModelId === model.id
                ? "bg-accent text-accent-foreground"
                : ""
            }`}
            onClick={() => setModel(model.id)}
          >
            <div className="truncate">{model.displayName}</div>
            <div className="text-[10px] text-muted-foreground">
              {model.parameterCount} · ~{model.estimatedSizeMB}mb
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
