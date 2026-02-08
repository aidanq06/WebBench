"use client";

import { useBenchmarkStore } from "@/store/benchmark-store";
import { TASK_DEFINITIONS } from "@/lib/benchmark/task-definitions";
import { Badge } from "@/components/ui/badge";

export function BenchmarkProgress() {
  const { currentTaskIndex, completedResults, currentStepLogs } =
    useBenchmarkStore();

  const currentTask = TASK_DEFINITIONS[currentTaskIndex];
  const totalTasks = TASK_DEFINITIONS.length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="text-sm">
          task {currentTaskIndex + 1} of {totalTasks}
        </div>
        <div className="text-xs text-muted-foreground">
          {completedResults.filter((r) => r.success).length} passed
        </div>
      </div>

      <div className="flex gap-1">
        {TASK_DEFINITIONS.map((_, i) => {
          const result = completedResults[i];
          let bg = "bg-secondary";
          if (i === currentTaskIndex) bg = "bg-primary";
          else if (result?.success) bg = "bg-green-600";
          else if (result && !result.success) bg = "bg-red-600";
          return <div key={i} className={`h-1.5 flex-1 ${bg}`} />;
        })}
      </div>

      {currentTask && (
        <div className="flex flex-col gap-2 border p-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{currentTask.title}</span>
            <Badge variant="secondary" className="text-xs">
              {currentTask.difficulty.toLowerCase()}
            </Badge>
          </div>
          <div className="text-xs text-muted-foreground">
            {currentTask.description}
          </div>
          <div className="text-xs text-muted-foreground">
            step {currentStepLogs.length} / {useBenchmarkStore.getState().config.maxSteps}
          </div>
        </div>
      )}

      {currentStepLogs.length > 0 && (
        <div className="flex max-h-48 flex-col gap-1 overflow-y-auto border p-3">
          {currentStepLogs.map((log) => (
            <div key={log.stepNumber} className="text-xs">
              <span className="text-muted-foreground">
                [{log.stepNumber}]
              </span>{" "}
              <span className="text-muted-foreground">{log.action.action}</span>
              {log.action.target && (
                <span> → {log.action.target}</span>
              )}
              {log.action.value && (
                <span className="text-muted-foreground">
                  {" "}
                  &quot;{log.action.value.substring(0, 40)}&quot;
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
