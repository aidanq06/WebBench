"use client";

import { BenchmarkReport } from "@/types/report";

export function TimeDistribution({ report }: { report: BenchmarkReport }) {
  const times = report.taskResults.map((r) => r.timeTakenMs);
  const minTime = Math.min(...times);
  const maxTime = Math.max(...times);
  const range = maxTime - minTime || 1;

  return (
    <div className="flex flex-col gap-2">
      <div className="text-xs text-muted-foreground">time distribution</div>
      <div className="relative h-10 border bg-secondary">
        {report.taskResults.map((result) => {
          const position = ((result.timeTakenMs - minTime) / range) * 100;
          return (
            <div
              key={result.taskId}
              className={`absolute top-1/2 h-3 w-3 -translate-y-1/2 ${
                result.success ? "bg-green-600" : "bg-red-600"
              }`}
              style={{ left: `${Math.min(position, 96)}%` }}
              title={`${result.taskId}: ${(result.timeTakenMs / 1000).toFixed(1)}s`}
            />
          );
        })}
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>{(minTime / 1000).toFixed(1)}s</span>
        <span>{(maxTime / 1000).toFixed(1)}s</span>
      </div>
    </div>
  );
}
