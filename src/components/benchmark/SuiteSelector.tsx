"use client";

import { useBenchmarkStore } from "@/store/benchmark-store";
import { TASK_SUITES } from "@/lib/benchmark/task-definitions";

export function SuiteSelector() {
  const { selectedSuiteId, setSuite } = useBenchmarkStore();

  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs text-muted-foreground">task suite</label>
      <div className="flex gap-2">
        {TASK_SUITES.map((suite) => (
          <button
            key={suite.id}
            className={`border px-4 py-2 text-sm hover:bg-accent/50 ${
              selectedSuiteId === suite.id
                ? "bg-accent text-accent-foreground"
                : ""
            }`}
            onClick={() => setSuite(suite.id)}
          >
            <div>{suite.name}</div>
            <div className="text-xs text-muted-foreground">
              {suite.taskIds.length} tasks · {suite.description}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
