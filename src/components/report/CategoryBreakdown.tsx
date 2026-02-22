"use client";

import { BenchmarkReport } from "@/types/report";
import { TASK_DEFINITIONS } from "@/lib/benchmark/task-definitions";

interface CategoryStats {
  category: string;
  total: number;
  passed: number;
  avgScore: number;
}

function getCategoryStats(report: BenchmarkReport): CategoryStats[] {
  const categories = new Map<string, { total: number; passed: number; scoreSum: number }>();

  for (const result of report.taskResults) {
    const task = TASK_DEFINITIONS.find((t) => t.id === result.taskId);
    const cat = task?.category ?? "unknown";
    const score = report.taskScores.find((s) => s.taskId === result.taskId);

    const entry = categories.get(cat) ?? { total: 0, passed: 0, scoreSum: 0 };
    entry.total++;
    if (result.success) entry.passed++;
    entry.scoreSum += score?.rawScore ?? 0;
    categories.set(cat, entry);
  }

  return Array.from(categories.entries()).map(([category, stats]) => ({
    category,
    total: stats.total,
    passed: stats.passed,
    avgScore: Math.round(stats.scoreSum / stats.total),
  }));
}

export function CategoryBreakdown({ report }: { report: BenchmarkReport }) {
  const stats = getCategoryStats(report);

  return (
    <div className="flex flex-col gap-2">
      <div className="text-xs text-muted-foreground">category breakdown</div>
      <div className={`grid gap-3 grid-cols-${Math.min(stats.length, 3)}`}>
        {stats.map((s) => (
          <div key={s.category} className="flex flex-col gap-2 border p-4">
            <div className="text-xs text-muted-foreground">{s.category} tasks</div>
            <div className="text-2xl font-medium">
              {s.total > 0 ? Math.round((s.passed / s.total) * 100) : 0}%
            </div>
            <div className="h-2 bg-secondary">
              <div
                className="h-2 bg-green-600"
                style={{ width: `${s.avgScore}%` }}
              />
            </div>
            <div className="text-xs text-muted-foreground">
              {s.passed}/{s.total} passed · avg score {s.avgScore}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
