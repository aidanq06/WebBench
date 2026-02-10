import { TaskResult } from "./task";

export interface TaskScore {
  taskId: string;
  rawScore: number;
  successScore: number;
  efficiencyScore: number;
}

export interface BenchmarkReport {
  runId: string;
  modelId: string;
  suiteId: string;
  overallScore: number;
  successRate: number;
  avgSteps: number;
  avgTimeMs: number;
  successCount: number;
  totalTasks: number;
  taskResults: TaskResult[];
  taskScores: TaskScore[];
  completedAt: string;
}
