"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { BenchmarkReport } from "@/types/report";
import { ScoreSummaryCard } from "@/components/report/ScoreSummaryCard";
import { MetricCards } from "@/components/report/MetricCards";
import { TaskResultsTable } from "@/components/report/TaskResultsTable";
import { ActionReplayLog } from "@/components/report/ActionReplayLog";

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
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
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
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center px-6 py-12">
      <div className="flex w-full max-w-2xl flex-col gap-6">
        <div>
          <h1 className="text-2xl font-medium tracking-tighter">
            benchmark report
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            {new Date(report.completedAt).toLocaleString()}
          </p>
        </div>

        <ScoreSummaryCard report={report} />
        <MetricCards report={report} />
        <TaskResultsTable report={report} />
        <ActionReplayLog results={report.taskResults} />

        <button
          className="self-start border px-4 py-2 text-sm hover:bg-accent/50"
          onClick={() => router.push("/benchmark")}
        >
          run again
        </button>
      </div>
    </div>
  );
}
