import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { BenchmarkReport } from "@/types/report";
import { ReportClient } from "./report-client";

interface Props {
  params: Promise<{ runId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { runId } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("reports")
    .select("model_display_name, accuracy, correct_count, total_questions")
    .eq("id", runId)
    .single();

  if (!data) {
    return { title: "benchmark report · webbench" };
  }

  const accuracy = Math.round(data.accuracy * 100);
  const title = `${data.model_display_name} · ${accuracy}% · webbench`;
  const description = `${accuracy}% accuracy on ${data.total_questions} questions (${data.correct_count} correct) — benchmarked locally in browser`;
  const ogImageUrl = `/api/og/${runId}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: ogImageUrl, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
    },
  };
}

export default async function ReportPage({ params }: Props) {
  const { runId } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("reports")
    .select("*")
    .eq("id", runId)
    .single();

  let dbReport: BenchmarkReport | null = null;

  let speedPercentile: number | null = null;

  if (data) {
    dbReport = {
      runId: data.id,
      modelId: data.model_id,
      modelDisplayName: data.model_display_name ?? data.model_id,
      suiteId: data.suite_id,
      overallAccuracy: data.accuracy,
      correctCount: data.correct_count,
      totalQuestions: data.total_questions,
      avgTimeMs: data.avg_time_ms,
      tokensPerSecond: data.tokens_per_second ?? 0,
      efficiencyScore: data.efficiency_score ?? 0,
      hardware: {
        gpuVendor: data.gpu_vendor ?? "unknown",
        gpuDevice: data.gpu_device ?? "unknown",
        deviceClass: data.device_class ?? "unknown",
        cpuThreads: data.cpu_threads ?? 0,
        browser: data.browser ?? "unknown",
        os: data.os ?? "unknown",
        webgpuBackend: data.webgpu_backend ?? "unknown",
      },
      subjectScores: data.subject_scores,
      difficultyScores: data.difficulty_scores,
      questionResults: data.question_results,
      completedAt: data.completed_at,
    };

    if (data.tokens_per_second) {
      const [fasterRes, totalRes] = await Promise.all([
        supabase.from("reports").select("*", { count: "exact", head: true }).lt("tokens_per_second", data.tokens_per_second),
        supabase.from("reports").select("*", { count: "exact", head: true }).not("tokens_per_second", "is", null),
      ]);
      const faster = fasterRes.count ?? 0;
      const total = totalRes.count ?? 0;
      if (total > 0) speedPercentile = Math.round((faster / total) * 100);
    }
  }

  return (
    <ReportClient
      runId={runId}
      dbReport={dbReport}
      savedToDb={!!dbReport}
      speedPercentile={speedPercentile}
    />
  );
}
