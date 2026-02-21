"use client";

import { BenchmarkReport } from "@/types/report";
import { TASK_DEFINITIONS } from "@/lib/benchmark/task-definitions";

export function StepEfficiency({ report }: { report: BenchmarkReport }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="text-xs text-muted-foreground">step efficiency</div>
      <div className="flex flex-col gap-1.5">
        {report.taskResults.map((result) => {
          const task = TASK_DEFINITIONS.find((t) => t.id === result.taskId);
          const pct = (result.stepsUsed / result.maxSteps) * 100;

          return (
            <div key={result.taskId} className="flex items-center gap-3">
              <span className="w-36 shrink-0 truncate text-xs">
                {task?.title ?? result.taskId}
              </span>
              <div className="relative h-4 flex-1 bg-secondary">
                <div
                  className="absolute inset-y-0 left-0 bg-foreground/40"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="w-12 shrink-0 text-right text-xs text-muted-foreground">
                {result.stepsUsed}/{result.maxSteps}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
