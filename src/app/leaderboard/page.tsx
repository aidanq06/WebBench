import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/landing/Navbar";
import { LeaderboardClient } from "./leaderboard-client";

export const revalidate = 60;

export default async function LeaderboardPage() {
  const supabase = await createClient();

  const [{ data: speedData }, { data: accuracyData }, { data: recentData }] = await Promise.all([
    supabase
      .from("reports")
      .select("id, model_display_name, tokens_per_second, gpu_device, device_class, browser, os, completed_at, profiles(username)")
      .not("tokens_per_second", "is", null)
      .order("tokens_per_second", { ascending: false })
      .limit(50),

    supabase
      .from("reports")
      .select("id, model_display_name, accuracy, efficiency_score, correct_count, total_questions, completed_at, profiles(username)")
      .not("efficiency_score", "is", null)
      .order("efficiency_score", { ascending: false })
      .limit(50),

    supabase
      .from("reports")
      .select("id, model_display_name, tokens_per_second, efficiency_score, accuracy, device_class, completed_at, profiles(username)")
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 py-12">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-medium tracking-tighter">leaderboard</h1>
          <p className="text-sm text-muted-foreground">
            speed ranks your hardware · efficiency ranks your model · sign in to appear
          </p>
        </div>

        <LeaderboardClient
          initialSpeed={(speedData ?? []) as unknown as Parameters<typeof LeaderboardClient>[0]["initialSpeed"]}
          initialAccuracy={(accuracyData ?? []) as unknown as Parameters<typeof LeaderboardClient>[0]["initialAccuracy"]}
          initialRecent={(recentData ?? []) as unknown as Parameters<typeof LeaderboardClient>[0]["initialRecent"]}
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
