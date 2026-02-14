import { getTasksForSuite } from "./task-definitions";
import { generateReport } from "./scorer";
import { runAgentOnTask } from "@/lib/agent/agent-loop";
import { usePortalStore } from "@/store/portal-store";
import { useBenchmarkStore } from "@/store/benchmark-store";
import { TaskResult } from "@/types/task";
import { BenchmarkReport } from "@/types/report";

export async function runBenchmark(
  portalRef: React.RefObject<HTMLDivElement | null>
): Promise<BenchmarkReport> {
  const store = useBenchmarkStore.getState();
  const tasks = getTasksForSuite(store.selectedSuiteId);
  const results: TaskResult[] = [];

  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];

    usePortalStore.getState().reset();
    await new Promise((r) => setTimeout(r, 200));

    useBenchmarkStore.getState().startTask(i);

    const result = await runAgentOnTask(task, {
      maxSteps: store.config.maxSteps,
      maxTimeMs: store.config.maxTimeMs,
      onStep: (log) => useBenchmarkStore.getState().addStep(log),
      portalRef,
    });

    results.push(result);
    useBenchmarkStore.getState().advanceTask(result);
  }

  const report = generateReport(
    results,
    store.selectedModelId,
    store.selectedSuiteId,
    crypto.randomUUID()
  );

  sessionStorage.setItem(
    `webbench-report-${report.runId}`,
    JSON.stringify(report)
  );

  useBenchmarkStore.getState().complete(report);
  return report;
}
