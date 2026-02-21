"use client";

import { BenchmarkReport } from "@/types/report";
import { TASK_DEFINITIONS } from "@/lib/benchmark/task-definitions";

export function TaskScoreChart({ report }: { report: BenchmarkReport }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="text-xs text-muted-foreground">score per task</div>
      <div className="flex flex-col gap-1.5">
        {report.taskResults.map((result) => {
          const task = TASK_DEFINITIONS.find((t) => t.id === result.taskId);
          const score = report.taskScores.find(
            (s) => s.taskId === result.taskId
          );
          const rawScore = score?.rawScore ?? 0;

          return (
            <div key={result.taskId} className="flex items-center gap-3">
              <span className="w-36 shrink-0 truncate text-xs">
                {task?.title ?? result.taskId}
              </span>
              <div className="relative h-5 flex-1 bg-secondary">
                <div
                  className={`absolute inset-y-0 left-0 ${
                    result.success ? "bg-green-600" : "bg-red-600"
                  }`}
                  style={{ width: `${rawScore}%` }}
                />
              </div>
              <span className="w-8 shrink-0 text-right text-xs text-muted-foreground">
                {rawScore}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
