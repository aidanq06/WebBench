"use client";

import { useBenchmarkStore } from "@/store/benchmark-store";
import { Progress } from "@/components/ui/progress";

export function LoadingOverlay() {
  const { loadingProgress, loadingText } = useBenchmarkStore();

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="text-sm">loading model...</div>
      <Progress value={loadingProgress * 100} className="w-64" />
      <div className="text-xs text-muted-foreground">{loadingText}</div>
    </div>
  );
}
