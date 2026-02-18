"use client";

import { useState } from "react";
import {
  TASK_DEFINITIONS,
  TASK_SUITES,
  getTasksForSuite,
} from "@/lib/benchmark/task-definitions";
import { Badge } from "@/components/ui/badge";

export function TaskPreviewGrid() {
  const [activeSuite, setActiveSuite] = useState("all");
  const tasks = getTasksForSuite(activeSuite);

  return (
    <section id="tasks" className="border-t px-6 py-12">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium tracking-tight">tasks</h2>
          <span className="text-xs text-muted-foreground">
            {TASK_DEFINITIONS.length} tasks across {TASK_SUITES.length - 1}{" "}
            suites
          </span>
        </div>

        <div className="flex gap-1">
          {TASK_SUITES.map((suite) => (
            <button
              key={suite.id}
              className={`border px-3 py-1.5 text-xs hover:bg-accent/50 ${
                activeSuite === suite.id
                  ? "bg-accent text-accent-foreground"
                  : ""
              }`}
              onClick={() => setActiveSuite(suite.id)}
            >
              {suite.name} ({suite.taskIds.length})
            </button>
          ))}
        </div>

        <div className="flex flex-col">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="flex items-start gap-4 border-b px-4 py-4 last:border-b-0"
            >
              <span className="mt-0.5 shrink-0 text-xs text-muted-foreground">
                {task.id}
              </span>
              <div className="flex flex-1 flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{task.title}</span>
                  <Badge variant="secondary" className="text-xs">
                    {task.difficulty.toLowerCase()}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {task.category}
                  </Badge>
                </div>
                <span className="text-xs text-muted-foreground">
                  {task.description}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
