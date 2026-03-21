"use client";

import { useBenchmarkStore } from "@/store/benchmark-store";
import { AVAILABLE_MODELS, modelLogo } from "@/lib/webllm/models";
import type { HardwareInfo } from "@/types/report";

function exceedsMemory(minVramMB: number, hardware: HardwareInfo | null): boolean {
  if (!hardware || hardware.maxBufferBytes === 0) return false;
  return minVramMB * 1024 * 1024 > hardware.maxBufferBytes;
}

export function ModelSelector({
  onSelect,
  hardware,
}: {
  onSelect?: (id: string) => void;
  hardware?: HardwareInfo | null;
}) {
  const { selectedModelId, setModel } = useBenchmarkStore();

  return (
    <div className="flex flex-col gap-3">
      <label className="text-sm text-muted-foreground">model</label>
      <div className="grid grid-cols-3 gap-3">
        {AVAILABLE_MODELS.map((model) => {
          const warn = exceedsMemory(model.minVramMB, hardware ?? null);
          return (
            <button
              key={model.id}
              className={`group relative overflow-hidden border px-4 py-5 text-left transition-colors hover:bg-accent/50 ${
                selectedModelId === model.id
                  ? "bg-accent text-accent-foreground"
                  : ""
              }`}
              onClick={() => { setModel(model.id); onSelect?.(model.id); }}
            >
              {/* default face */}
              <div className="flex flex-col gap-3 transition-opacity duration-150 group-hover:opacity-0">
                <div className="flex items-start justify-between">
                  {(() => {
                    const logo = modelLogo(model.id);
                    return logo ? (
                      <img src={logo} alt="" className="h-7 w-7 object-contain" />
                    ) : (
                      <span className="h-7 w-7" />
                    );
                  })()}
                  {warn && (
                    <span className="text-[10px] text-yellow-500/70" title="may exceed your GPU memory">⚠</span>
                  )}
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="truncate text-sm font-medium">{model.displayName}</span>
                  <span className="text-xs text-muted-foreground">{model.parameterCount}</span>
                </div>
              </div>
              {/* hover face */}
              <div className="absolute inset-0 flex flex-col justify-center px-4 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                <div className="truncate text-sm font-medium">{model.parameterCount} params</div>
                <div className={`text-xs ${warn ? "text-yellow-500/70" : "text-muted-foreground"}`}>
                  {warn
                    ? "may exceed gpu memory"
                    : `~${model.estimatedSizeMB >= 1000 ? `${(model.estimatedSizeMB / 1000).toFixed(1)}gb` : `${model.estimatedSizeMB}mb`} download`}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
