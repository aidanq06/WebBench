import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { BenchmarkReport } from "@/types/report";

export async function POST(request: Request) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const report: BenchmarkReport = await request.json();

  const { data, error } = await supabase
    .from("reports")
    .insert({
      id: report.runId,
      user_id: user.id,
      model_id: report.modelId,
      model_display_name: report.modelDisplayName,
      suite_id: report.suiteId,
      accuracy: report.overallAccuracy,
      correct_count: report.correctCount,
      total_questions: report.totalQuestions,
      avg_time_ms: report.avgTimeMs,
      tokens_per_second: report.tokensPerSecond,
      efficiency_score: report.efficiencyScore,
      gpu_vendor: report.hardware?.gpuVendor,
      gpu_device: report.hardware?.gpuDevice,
      device_class: report.hardware?.deviceClass,
      cpu_threads: report.hardware?.cpuThreads,
      browser: report.hardware?.browser,
      os: report.hardware?.os,
      webgpu_backend: report.hardware?.webgpuBackend,
      subject_scores: report.subjectScores,
      difficulty_scores: report.difficultyScores,
      question_results: report.questionResults,
      completed_at: report.completedAt,
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ id: data.id });
}
