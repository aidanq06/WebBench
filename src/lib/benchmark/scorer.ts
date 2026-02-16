import { TaskResult } from "@/types/task";
import { TaskScore, BenchmarkReport } from "@/types/report";

const SUCCESS_WEIGHT = 0.7;
const EFFICIENCY_WEIGHT = 0.3;

export function scoreTask(result: TaskResult): TaskScore {
  const successScore = result.success ? 100 : 0;

  const efficiencyScore = result.success
    ? Math.max(
        0,
        100 * (1 - (result.stepsUsed - 1) / (result.maxSteps - 1))
      )
    : 0;

  const rawScore =
    SUCCESS_WEIGHT * successScore + EFFICIENCY_WEIGHT * efficiencyScore;

  return {
    taskId: result.taskId,
    rawScore: Math.round(rawScore * 10) / 10,
    successScore,
    efficiencyScore: Math.round(efficiencyScore * 10) / 10,
  };
}

export function generateReport(
  results: TaskResult[],
  modelId: string,
  suiteId: string,
  runId: string
): BenchmarkReport {
  const taskScores = results.map(scoreTask);
  const overallScore = Math.round(
    taskScores.reduce((sum, s) => sum + s.rawScore, 0) / taskScores.length
  );

  const successCount = results.filter((r) => r.success).length;
  const successRate = successCount / results.length;

  const avgSteps =
    results.reduce((sum, r) => sum + r.stepsUsed, 0) / results.length;

  const avgTimeMs =
    results.reduce((sum, r) => sum + r.timeTakenMs, 0) / results.length;

  return {
    runId,
    modelId,
    suiteId,
    overallScore,
    successRate,
    avgSteps: Math.round(avgSteps * 10) / 10,
    avgTimeMs: Math.round(avgTimeMs),
    successCount,
    totalTasks: results.length,
    taskResults: results,
    taskScores,
    completedAt: new Date().toISOString(),
  };
}
