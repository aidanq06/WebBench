"use client";

import { BenchmarkReport } from "@/types/report";

export function ScoreSummaryCard({ report }: { report: BenchmarkReport }) {
  return (
    <div className="flex flex-col items-center gap-2 border p-8">
      <div className="text-6xl font-medium tracking-tighter">
        {report.overallScore}
      </div>
      <div className="text-sm text-muted-foreground">overall score</div>
      <div className="mt-2 text-sm">
        {report.successCount}/{report.totalTasks} tasks passed ·{" "}
        {Math.round(report.successRate * 100)}% success rate
      </div>
    </div>
  );
}
