"use client";

import { useState } from "react";
import { TaskResult } from "@/types/task";
import { TASK_DEFINITIONS } from "@/lib/benchmark/task-definitions";

export function ActionReplayLog({ results }: { results: TaskResult[] }) {
  const [openTask, setOpenTask] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-1">
      <h3 className="text-sm font-medium">action replay</h3>
      {results.map((result) => {
        const task = TASK_DEFINITIONS.find((t) => t.id === result.taskId);
        const isOpen = openTask === result.taskId;

        return (
          <div key={result.taskId} className="border">
            <button
              className="flex w-full items-center justify-between px-4 py-2 text-left text-sm hover:bg-accent/50"
              onClick={() =>
                setOpenTask(isOpen ? null : result.taskId)
              }
            >
              <span>
                {task?.title ?? result.taskId} —{" "}
                {result.success ? "pass" : "fail"}
              </span>
              <span className="text-xs text-muted-foreground">
                {result.stepLogs.length} steps
              </span>
            </button>

            {isOpen && (
              <div className="flex flex-col gap-2 border-t px-4 py-3">
                {result.stepLogs.map((log) => (
                  <div
                    key={log.stepNumber}
                    className="flex flex-col gap-1 text-xs"
                  >
                    <div className="text-muted-foreground">
                      step {log.stepNumber}
                    </div>
                    <div className="overflow-x-auto bg-secondary p-2">
                      <pre className="whitespace-pre-wrap">
                        {JSON.stringify(log.action, null, 2)}
                      </pre>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
