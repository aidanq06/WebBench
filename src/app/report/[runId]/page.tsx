"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { BenchmarkReport } from "@/types/report";
import { TASK_SUITES } from "@/lib/benchmark/task-definitions";
import { Badge } from "@/components/ui/badge";
import { ScoreSummaryCard } from "@/components/report/ScoreSummaryCard";
import { TaskTimeline } from "@/components/report/TaskTimeline";
import { MetricCards } from "@/components/report/MetricCards";
import { CategoryBreakdown } from "@/components/report/CategoryBreakdown";
import { TaskScoreChart } from "@/components/report/TaskScoreChart";
import { StepEfficiency } from "@/components/report/StepEfficiency";
import { TimeDistribution } from "@/components/report/TimeDistribution";
import { TaskResultsTable } from "@/components/report/TaskResultsTable";
import { ActionReplayLog } from "@/components/report/ActionReplayLog";
import { Navbar } from "@/components/landing/Navbar";

export default function ReportPage() {
  const params = useParams();
  const router = useRouter();
  const [report, setReport] = useState<BenchmarkReport | null>(null);

  useEffect(() => {
    const runId = params.runId as string;
    const stored = sessionStorage.getItem(`webbench-report-${runId}`);
    if (stored) {
      setReport(JSON.parse(stored));
    }
  }, [params.runId]);

  if (!report) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <div className="flex flex-1 flex-col items-center justify-center gap-4">
          <div className="text-sm text-muted-foreground">
            report not found
          </div>
          <button
            className="border px-4 py-2 text-sm hover:bg-accent/50"
            onClick={() => router.push("/benchmark")}
          >
            run a benchmark
          </button>
        </div>
      </div>
    );
  }

  const suite = TASK_SUITES.find((s) => s.id === report.suiteId);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <div className="flex flex-1 flex-col items-center px-6 py-12">
        <div className="flex w-full max-w-2xl flex-col gap-6">
          <div>
            <button
              className="mb-3 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => router.push("/benchmark")}
            >
              ← back to benchmark
            </button>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-medium tracking-tighter">
                benchmark report
              </h1>
              {suite && (
                <Badge variant="secondary" className="text-xs">
                  {suite.name}
                </Badge>
              )}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {new Date(report.completedAt).toLocaleString()}
            </p>
          </div>

          <ScoreSummaryCard report={report} />
          <TaskTimeline report={report} />
          <MetricCards report={report} />
          <CategoryBreakdown report={report} />
          <TaskScoreChart report={report} />
          <StepEfficiency report={report} />
          <TimeDistribution report={report} />
          <TaskResultsTable report={report} />
          <ActionReplayLog results={report.taskResults} />
        </div>
      </div>
    </div>
  );
}
