"use client";

import { BenchmarkReport } from "@/types/report";
import { ScoreGauge } from "./ScoreGauge";

export function ScoreSummaryCard({ report }: { report: BenchmarkReport }) {
  return (
    <div className="flex flex-col items-center gap-2 border p-8">
      <ScoreGauge score={report.overallScore} />
      <div className="text-sm text-muted-foreground">overall score</div>
      <div className="mt-2 text-sm">
        {report.successCount}/{report.totalTasks} tasks passed ·{" "}
        {Math.round(report.successRate * 100)}% success rate
      </div>
    </div>
  );
}
