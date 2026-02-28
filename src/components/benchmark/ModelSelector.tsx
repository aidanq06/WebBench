"use client";

import { useBenchmarkStore } from "@/store/benchmark-store";
import { AVAILABLE_MODELS } from "@/lib/webllm/models";

export function ModelSelector() {
  const { selectedModelId, setModel } = useBenchmarkStore();

  return (
    <div className="flex flex-col gap-3">
      <label className="text-xs text-muted-foreground">model</label>
      <div className="grid grid-cols-3 gap-2">
        {AVAILABLE_MODELS.map((model) => (
          <button
            key={model.id}
            className={`group relative overflow-hidden border px-3 py-4 text-left text-sm transition-colors hover:bg-accent/50 ${
              selectedModelId === model.id
                ? "bg-accent text-accent-foreground"
                : ""
            }`}
            onClick={() => setModel(model.id)}
          >
            <div className="flex flex-col gap-1 transition-opacity duration-150 group-hover:opacity-0">
              <span className="truncate text-sm">{model.displayName}</span>
              <span className="text-[10px] text-muted-foreground">{model.parameterCount}</span>
            </div>
            <div className="absolute inset-0 flex flex-col justify-center px-3 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
              <div className="truncate text-xs font-medium">{model.parameterCount} params</div>
              <div className="text-[10px] text-muted-foreground">
                ~{model.estimatedSizeMB >= 1000 ? `${(model.estimatedSizeMB / 1000).toFixed(1)}gb` : `${model.estimatedSizeMB}mb`} download
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
