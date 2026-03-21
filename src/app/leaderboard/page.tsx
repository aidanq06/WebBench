// ── Demo mode ─── set to false (and delete _demo-data.ts) when real data exists
const DEMO_MODE = false;

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/landing/Navbar";
import { LeaderboardClient } from "./leaderboard-client";
import { AVAILABLE_MODELS } from "@/lib/webllm/models";
import type { ModelAggregate, RunRow, RecentRow } from "./leaderboard-client";
import { DEMO_MODELS, DEMO_RECENT } from "./_demo-data";

export const revalidate = 0;

interface RawReport {
  id: string;
  model_id: string;
  model_display_name: string;
  accuracy: number;
  correct_count: number;
  total_questions: number;
  score: number;
  tokens_per_second: number | null;
  subject_scores: { subject: string; correct: number; total: number; accuracy: number }[] | null;
  difficulty_scores: { difficulty: string; correct: number; total: number; accuracy: number }[] | null;
  completed_at: string;
}

function aggregateModels(reports: RawReport[]): ModelAggregate[] {
  const map = new Map<string, { reports: RawReport[] }>();

  for (const r of reports) {
    const key = r.model_id;
    if (!map.has(key)) map.set(key, { reports: [] });
    map.get(key)!.reports.push(r);
  }

  const result: ModelAggregate[] = [];

  for (const [modelId, { reports: rs }] of map) {
    const runCount = rs.length;
    const avgAccuracy = rs.reduce((s, r) => s + r.accuracy, 0) / runCount;
    const avgScore = Math.round(rs.reduce((s, r) => s + (r.score ?? 0), 0) / runCount);

    // average subject scores across all runs
    const subjectSums: Record<string, { sum: number; count: number }> = {};
    for (const r of rs) {
      for (const s of r.subject_scores ?? []) {
        if (!subjectSums[s.subject]) subjectSums[s.subject] = { sum: 0, count: 0 };
        subjectSums[s.subject].sum += s.accuracy;
        subjectSums[s.subject].count += 1;
      }
    }
    const subjectAvgs = {
      cs: subjectSums["cs"] ? subjectSums["cs"].sum / subjectSums["cs"].count : 0,
      engineering: subjectSums["engineering"] ? subjectSums["engineering"].sum / subjectSums["engineering"].count : 0,
      math: subjectSums["math"] ? subjectSums["math"].sum / subjectSums["math"].count : 0,
      science: subjectSums["science"] ? subjectSums["science"].sum / subjectSums["science"].count : 0,
    };

    // average difficulty scores
    const diffSums: Record<string, { sum: number; count: number }> = {};
    for (const r of rs) {
      for (const d of r.difficulty_scores ?? []) {
        if (!diffSums[d.difficulty]) diffSums[d.difficulty] = { sum: 0, count: 0 };
        diffSums[d.difficulty].sum += d.accuracy;
        diffSums[d.difficulty].count += 1;
      }
    }
    const difficultyAvgs = {
      easy: diffSums["easy"] ? diffSums["easy"].sum / diffSums["easy"].count : 0,
      medium: diffSums["medium"] ? diffSums["medium"].sum / diffSums["medium"].count : 0,
      hard: diffSums["hard"] ? diffSums["hard"].sum / diffSums["hard"].count : 0,
    };

    const model = AVAILABLE_MODELS.find((m) => m.id === modelId);
    const parameterCount = model?.parameterCount ?? "";

    const recentRuns: RunRow[] = rs
      .sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime())
      .map((r) => ({
        id: r.id,
        score: r.score ?? 0,
        correct_count: r.correct_count,
        total_questions: r.total_questions,
        tokens_per_second: r.tokens_per_second,
        completed_at: r.completed_at,
      }));

    result.push({
      modelId,
      displayName: rs[0].model_display_name,
      parameterCount,
      runCount,
      avgAccuracy,
      avgScore,
      subjectAvgs,
      difficultyAvgs,
      recentRuns,
    });
  }

  return result.sort((a, b) => b.avgScore - a.avgScore);
}

export default async function LeaderboardPage() {
  if (DEMO_MODE) {
    // Inject param counts from AVAILABLE_MODELS
    const demoModels = DEMO_MODELS.map((m) => ({
      ...m,
      parameterCount: AVAILABLE_MODELS.find((am) => am.id === m.modelId)?.parameterCount ?? "",
    }));
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 py-12">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-medium tracking-tighter">leaderboard</h1>
            <p className="text-sm text-muted-foreground">
              community model rankings · every run contributes
            </p>
          </div>
          <LeaderboardClient models={demoModels} initialRecent={DEMO_RECENT} />
          <div className="border-t pt-8 text-center">
            <p className="mb-3 text-sm text-muted-foreground">
              run the benchmark — no api key, no install
            </p>
            <Link href="/benchmark" className="inline-flex border px-5 py-2 text-sm transition-colors hover:bg-accent/50">
              run benchmark →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const supabase = await createClient();

  const [{ data: allReportsData }, { data: recentData }] = await Promise.all([
    supabase
      .from("reports")
      .select("id, model_id, model_display_name, accuracy, correct_count, total_questions, score, tokens_per_second, subject_scores, difficulty_scores, completed_at")
      .order("completed_at", { ascending: false }),

    supabase
      .from("reports")
      .select("id, model_display_name, score, tokens_per_second, device_class, completed_at")
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const models = aggregateModels((allReportsData ?? []) as unknown as RawReport[]);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 py-12">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-medium tracking-tighter">leaderboard</h1>
          <p className="text-sm text-muted-foreground">
            community model rankings · every run contributes
          </p>
        </div>

        <LeaderboardClient
          models={models}
          initialRecent={(recentData ?? []) as unknown as RecentRow[]}
        />

        <div className="border-t pt-8 text-center">
          <p className="mb-3 text-sm text-muted-foreground">
            run the benchmark — no api key, no install
          </p>
          <Link
            href="/benchmark"
            className="inline-flex border px-5 py-2 text-sm transition-colors hover:bg-accent/50"
          >
            run benchmark →
          </Link>
        </div>
      </div>
    </div>
  );
}
