import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/landing/Navbar";
import { LeaderboardClient } from "./leaderboard-client";
import type { ModelAggregate, RunRow, SpeedRow, RecentRow } from "./leaderboard-client";

export const revalidate = 60;

interface RawReport {
  id: string;
  model_id: string;
  model_display_name: string;
  accuracy: number;
  correct_count: number;
  total_questions: number;
  tokens_per_second: number | null;
  subject_scores: { subject: string; correct: number; total: number; accuracy: number }[] | null;
  difficulty_scores: { difficulty: string; correct: number; total: number; accuracy: number }[] | null;
  completed_at: string;
  profiles: { username: string | null } | null;
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
    const bestAccuracy = Math.max(...rs.map((r) => r.accuracy));

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

    const recentRuns: RunRow[] = rs
      .sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime())
      .map((r) => ({
        id: r.id,
        accuracy: r.accuracy,
        correct_count: r.correct_count,
        total_questions: r.total_questions,
        tokens_per_second: r.tokens_per_second,
        completed_at: r.completed_at,
        profiles: r.profiles,
      }));

    result.push({
      modelId,
      displayName: rs[0].model_display_name,
      runCount,
      avgAccuracy,
      subjectAvgs,
      difficultyAvgs,
      bestAccuracy,
      recentRuns,
    });
  }

  return result.sort((a, b) => b.avgAccuracy - a.avgAccuracy);
}

export default async function LeaderboardPage() {
  const supabase = await createClient();

  const [{ data: allReportsData }, { data: speedData }, { data: recentData }] = await Promise.all([
    supabase
      .from("reports")
      .select("id, model_id, model_display_name, accuracy, correct_count, total_questions, tokens_per_second, subject_scores, difficulty_scores, completed_at, profiles(username)")
      .order("completed_at", { ascending: false }),

    supabase
      .from("reports")
      .select("id, model_display_name, tokens_per_second, gpu_device, device_class, browser, os, completed_at, profiles(username)")
      .not("tokens_per_second", "is", null)
      .order("tokens_per_second", { ascending: false })
      .limit(50),

    supabase
      .from("reports")
      .select("id, model_display_name, tokens_per_second, efficiency_score, accuracy, device_class, completed_at, profiles(username)")
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const models = aggregateModels((allReportsData ?? []) as unknown as RawReport[]);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-12">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-medium tracking-tighter">leaderboard</h1>
          <p className="text-sm text-muted-foreground">
            community model rankings · hardware speed · live feed
          </p>
        </div>

        <LeaderboardClient
          models={models}
          initialSpeed={(speedData ?? []) as unknown as SpeedRow[]}
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
