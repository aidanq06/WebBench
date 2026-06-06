import type { Metadata } from "next";
import { BenchmarkReport } from "@/types/report";
import { ReportClient } from "./report-client";
import { wilsonInterval } from "@/lib/benchmark/scorer";
import { getRunById } from "@/lib/supabase/queries";

interface Props {
  params: Promise<{ runId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { runId } = await params;
  const run = await getRunById(runId);

  if (!run) {
    return { title: "benchmark report · webbench" };
  }

  const accuracy = Math.round(run.accuracy * 100);
  const title = `${run.modelDisplayName} · ${accuracy}% accuracy · webbench`;
  const description = `${accuracy}% on ${run.totalQuestions} questions (${run.correctCount} correct) — benchmarked locally in browser`;
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
  const run = await getRunById(runId);

  let dbReport: BenchmarkReport | null = null;

  if (run) {
    const subjectScoresRaw = (run.subjectScores ?? []) as Array<{ subject: string; correct: number; total: number; accuracy: number; confidenceInterval?: unknown }>;
    const difficultyScoresRaw = (run.difficultyScores ?? []) as Array<{ difficulty: string; correct: number; total: number; accuracy: number; confidenceInterval?: unknown }>;
    const subjectScores = subjectScoresRaw.map((s) => ({
      ...s,
      confidenceInterval: s.confidenceInterval ?? wilsonInterval(s.correct, s.total),
    }));
    const difficultyScores = difficultyScoresRaw.map((s) => ({
      ...s,
      confidenceInterval: s.confidenceInterval ?? wilsonInterval(s.correct, s.total),
    }));

    dbReport = {
      runId: run.runId,
      modelId: run.modelId,
      modelDisplayName: run.modelDisplayName,
      suiteId: run.suiteId,
      overallAccuracy: run.accuracy,
      correctCount: run.correctCount,
      totalQuestions: run.totalQuestions,
      avgTimeMs: run.avgTimeMs,
      tokensPerSecond: run.tokensPerSecond,
      score: run.score,
      confidenceInterval: wilsonInterval(run.correctCount, run.totalQuestions),
      hardware: {
        ...run.hardware,
        deviceClass: (run.hardware.deviceClass as BenchmarkReport["hardware"]["deviceClass"]) ?? "unknown",
        maxBufferBytes: 0,
      },
      subjectScores: subjectScores as BenchmarkReport["subjectScores"],
      difficultyScores: difficultyScores as BenchmarkReport["difficultyScores"],
      questionResults: run.questionResults,
      completedAt: run.completedAt,
    };
  }

  return (
    <ReportClient
      runId={runId}
      dbReport={dbReport}
      savedToDb={!!dbReport}
    />
  );
}
