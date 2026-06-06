import { createClient } from "./server";
import type { QuestionResult } from "@/types/task";

export interface ModelAggregate {
  modelId: string;
  modelDisplayName: string;
  runCount: number;
  avgAccuracy: number;        // 0–1
  bestAccuracy: number;       // 0–1
  medianTokPerSec: number;
  totalQuestions: number;     // sum across all community runs
  hardwareBreakdown: Record<string, number>; // device_class → count
  lastRunAt: string | null;
  subjectAvgs: Record<string, number>;       // subject → avg accuracy
}

export interface RecentRun {
  runId: string;
  modelId: string;
  modelDisplayName: string;
  score: number;
  correctCount: number;
  totalQuestions: number;
  tokensPerSecond: number;
  deviceClass: string | null;
  os: string | null;
  completedAt: string;
}

interface RawRun {
  id: string;
  model_id: string;
  model_display_name: string;
  score: number;
  accuracy: number;
  correct_count: number;
  total_questions: number;
  tokens_per_second: number;
  subject_scores: Array<{ subject: string; accuracy: number }> | null;
  device_class: string | null;
  os: string | null;
  completed_at: string;
}

interface RawModelStat {
  model_id: string;
  model_display_name: string;
  run_count: number;
  avg_accuracy: number | string;
  best_accuracy: number | string;
  median_tok_per_sec: number | string | null;
  total_questions: number;
  last_run_at: string | null;
  subject_avgs: Record<string, number | string> | null;
  hardware_breakdown: Record<string, number> | null;
}

// Reads pre-aggregated per-model stats from the `model_stats` view (computed in
// Postgres). Bounded to one row per model — never fetches individual runs.
export async function getModelStats(): Promise<ModelAggregate[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("model_stats").select("*");

  if (error || !data) return [];

  const stats = (data as RawModelStat[]).map((r) => {
    const subjectAvgs: Record<string, number> = {};
    for (const [k, v] of Object.entries(r.subject_avgs ?? {})) {
      subjectAvgs[k] = Number(v);
    }
    return {
      modelId: r.model_id,
      modelDisplayName: r.model_display_name,
      runCount: r.run_count,
      avgAccuracy: Number(r.avg_accuracy),
      bestAccuracy: Number(r.best_accuracy),
      medianTokPerSec: Number(r.median_tok_per_sec ?? 0),
      totalQuestions: r.total_questions,
      hardwareBreakdown: r.hardware_breakdown ?? {},
      lastRunAt: r.last_run_at,
      subjectAvgs,
    } satisfies ModelAggregate;
  });

  return stats.sort((a, b) => b.avgAccuracy - a.avgAccuracy);
}

// Paginated runs for a single model. Requests `limit + 1` to cheaply detect
// whether another page exists.
export async function getRecentRunsForModel(
  modelId: string,
  limit = 12,
  offset = 0,
): Promise<{ runs: RecentRun[]; hasMore: boolean }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("runs")
    .select("id, model_id, model_display_name, score, correct_count, total_questions, tokens_per_second, device_class, os, completed_at")
    .eq("model_id", modelId)
    .order("completed_at", { ascending: false })
    .range(offset, offset + limit); // inclusive — fetches limit + 1 rows

  if (error || !data) return { runs: [], hasMore: false };

  const rows = data as Array<Pick<RawRun, "id" | "model_id" | "model_display_name" | "score" | "correct_count" | "total_questions" | "tokens_per_second" | "device_class" | "os" | "completed_at">>;
  const hasMore = rows.length > limit;
  const runs = rows.slice(0, limit).map((r) => ({
    runId: r.id,
    modelId: r.model_id,
    modelDisplayName: r.model_display_name,
    score: r.score,
    correctCount: r.correct_count,
    totalQuestions: r.total_questions,
    tokensPerSecond: r.tokens_per_second,
    deviceClass: r.device_class,
    os: r.os,
    completedAt: r.completed_at,
  }));

  return { runs, hasMore };
}

export interface SingleRun {
  runId: string;
  modelId: string;
  modelDisplayName: string;
  suiteId: string;
  accuracy: number;
  correctCount: number;
  totalQuestions: number;
  avgTimeMs: number;
  tokensPerSecond: number;
  score: number;
  subjectScores: unknown;
  difficultyScores: unknown;
  questionResults: QuestionResult[];
  hardware: {
    gpuVendor: string;
    gpuDevice: string;
    deviceClass: string;
    cpuThreads: number;
    browser: string;
    os: string;
    webgpuBackend: string;
  };
  completedAt: string;
}

export async function getRunById(runId: string): Promise<SingleRun | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("runs")
    .select("*")
    .eq("id", runId)
    .single();

  if (error || !data) return null;

  return {
    runId: data.id,
    modelId: data.model_id,
    modelDisplayName: data.model_display_name,
    suiteId: data.suite_id,
    accuracy: data.accuracy,
    correctCount: data.correct_count,
    totalQuestions: data.total_questions,
    avgTimeMs: data.avg_time_ms,
    tokensPerSecond: data.tokens_per_second,
    score: data.score,
    subjectScores: data.subject_scores,
    difficultyScores: data.difficulty_scores,
    questionResults: data.question_results ?? [],
    hardware: {
      gpuVendor: data.gpu_vendor ?? "unknown",
      gpuDevice: data.gpu_device ?? "unknown",
      deviceClass: data.device_class ?? "unknown",
      cpuThreads: data.cpu_threads ?? 0,
      browser: data.browser ?? "unknown",
      os: data.os ?? "unknown",
      webgpuBackend: data.webgpu_backend ?? "unknown",
    },
    completedAt: data.completed_at,
  };
}
