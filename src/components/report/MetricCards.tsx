"use client";

import { BenchmarkReport } from "@/types/report";
import { AVAILABLE_MODELS } from "@/lib/webllm/models";

export function MetricCards({ report }: { report: BenchmarkReport }) {
  const model = AVAILABLE_MODELS.find((m) => m.id === report.modelId);

  const metrics = [
    { label: "model", value: model?.displayName ?? report.modelId },
    { label: "avg steps", value: String(report.avgSteps) },
    {
      label: "avg time",
      value: `${(report.avgTimeMs / 1000).toFixed(1)}s`,
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {metrics.map((m) => (
        <div key={m.label} className="border p-4">
          <div className="text-lg font-medium">{m.value}</div>
          <div className="text-xs text-muted-foreground">{m.label}</div>
        </div>
      ))}
    </div>
  );
}
