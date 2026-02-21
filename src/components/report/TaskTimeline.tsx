"use client";

import { BenchmarkReport } from "@/types/report";

export function TaskTimeline({ report }: { report: BenchmarkReport }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="text-xs text-muted-foreground">pass / fail sequence</div>
      <div className="flex gap-1">
        {report.taskResults.map((result) => (
          <div key={result.taskId} className="flex flex-col items-center gap-1">
            <div
              className={`h-8 w-8 ${
                result.success ? "bg-green-600" : "bg-red-600"
              }`}
              title={`${result.taskId}: ${result.success ? "pass" : "fail"}`}
            />
            <span className="text-[10px] text-muted-foreground">
              {result.taskId}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
