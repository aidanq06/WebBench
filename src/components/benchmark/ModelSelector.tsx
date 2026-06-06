"use client";

import { useBenchmarkStore } from "@/store/benchmark-store";
import { AVAILABLE_MODELS, modelLogo } from "@/lib/webllm/models";
import type { HardwareInfo } from "@/types/report";
import { motion } from "framer-motion";
import { EASE, ITEM_DURATION, ITEM_RISE_PX, STAGGER_MS } from "@/lib/motion";

function exceedsMemory(minVramMB: number, hardware: HardwareInfo | null): boolean {
  if (!hardware || hardware.maxBufferBytes === 0) return false;
  return minVramMB * 1024 * 1024 > hardware.maxBufferBytes;
}

function formatSize(mb: number): string {
  return mb >= 1000 ? `${(mb / 1000).toFixed(1)}gb` : `${mb}mb`;
}

const MAX_SIZE = 5000;

export function ModelSelector({
  onSelect,
  hardware,
}: {
  onSelect?: (id: string) => void;
  hardware?: HardwareInfo | null;
}) {
  const { selectedModelId, setModel } = useBenchmarkStore();

  return (
    <div className="grid grid-cols-3 gap-1.5">
      {AVAILABLE_MODELS.map((model, idx) => {
        const warn = exceedsMemory(model.minVramMB, hardware ?? null);
        const logo = modelLogo(model.id);
        const selected = selectedModelId === model.id;
        const sizePct = Math.round((model.estimatedSizeMB / MAX_SIZE) * 100);

        return (
          <motion.button
            key={model.id}
            initial={{ opacity: 0, y: ITEM_RISE_PX }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: ITEM_DURATION, ease: EASE, delay: idx * STAGGER_MS }}
            onClick={() => { setModel(model.id); onSelect?.(model.id); }}
            className={`relative flex flex-col gap-3 border p-4 text-left transition-colors ${
              selected
                ? "border-foreground/25 bg-foreground/5"
                : "border-[--border] hover:border-foreground/15 hover:bg-foreground/[0.03]"
            }`}
          >
            {logo
              ? <img src={logo} alt="" className="h-5 w-5 object-contain" />
              : <span className="h-5 w-5" />
            }
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-medium leading-snug">{model.displayName}</span>
              <span className={`font-mono text-[10px] ${warn ? "text-yellow-500/70" : "text-[--fg-subtle]"}`}>
                {model.parameterCount} · ~{formatSize(model.estimatedSizeMB)}
                {warn && " ⚠"}
              </span>
            </div>
            {/* relative size bar */}
            <div className="relative h-px w-full bg-[--border]">
              <motion.div
                className="absolute inset-y-0 left-0 bg-muted-foreground/35"
                initial={{ width: 0 }}
                animate={{ width: `${sizePct}%` }}
                transition={{ duration: 0.6, ease: "easeOut", delay: 0.15 + idx * STAGGER_MS }}
              />
            </div>
            {selected && (
              <span className="absolute right-3 top-3 font-mono text-[9px] text-[--fg-subtle]">
                selected
              </span>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
