import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/landing/Navbar";

interface RunRow {
  id: string;
  model_display_name: string;
  accuracy: number;
  correct_count: number;
  total_questions: number;
  avg_time_ms: number;
  completed_at: string;
}

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/");

  const username = user.user_metadata?.user_name ?? user.user_metadata?.name ?? user.email ?? "user";
  const avatarUrl = user.user_metadata?.avatar_url as string | undefined;

  const { data: runs } = await supabase
    .from("reports")
    .select("id, model_display_name, accuracy, correct_count, total_questions, avg_time_ms, completed_at")
    .eq("user_id", user.id)
    .order("completed_at", { ascending: false });

  const rows = (runs ?? []) as RunRow[];
  const totalRuns = rows.length;
  const bestAccuracy = totalRuns > 0 ? Math.max(...rows.map((r) => r.accuracy)) : null;

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-6 py-12">
        {/* profile header */}
        <div className="flex items-center gap-4">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt={username} className="h-12 w-12 rounded-full object-cover" />
          ) : (
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-lg font-medium">
              {String(username)[0].toUpperCase()}
            </span>
          )}
          <div className="flex flex-col gap-0.5">
            <h1 className="text-lg font-medium">{username}</h1>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
        </div>

        {/* summary stats */}
        {totalRuns > 0 && (
          <div className="grid grid-cols-2 gap-px border sm:grid-cols-3">
            <div className="flex flex-col items-center gap-1 bg-background p-6">
              <span className="text-3xl font-medium tracking-tight">{totalRuns}</span>
              <span className="text-xs text-muted-foreground">total runs</span>
            </div>
            <div className="flex flex-col items-center gap-1 bg-background p-6">
              <span className="text-3xl font-medium tracking-tight">
                {Math.round((bestAccuracy ?? 0) * 100)}%
              </span>
              <span className="text-xs text-muted-foreground">best score</span>
            </div>
            <div className="flex flex-col items-center gap-1 bg-background p-6 max-sm:col-span-2">
              <span className="text-3xl font-medium tracking-tight">
                {Math.round(rows.reduce((s, r) => s + r.accuracy, 0) / totalRuns * 100)}%
              </span>
              <span className="text-xs text-muted-foreground">avg score</span>
            </div>
          </div>
        )}

        {/* run history */}
        <div className="flex flex-col gap-4">
          <div className="text-xs text-muted-foreground">run history</div>
          {rows.length === 0 ? (
            <div className="flex flex-col items-center gap-4 border py-12 text-center">
              <p className="text-sm text-muted-foreground">no runs yet</p>
              <Link
                href="/benchmark"
                className="border px-5 py-2 text-sm transition-colors hover:bg-accent/50"
              >
                run your first benchmark →
              </Link>
            </div>
          ) : (
            <div className="flex flex-col border">
              {rows.map((run) => {
                const accuracy = Math.round(run.accuracy * 100);
                return (
                  <Link
                    key={run.id}
                    href={`/report/${run.id}`}
                    className="flex items-center gap-4 border-b px-5 py-4 last:border-b-0 transition-colors hover:bg-accent/20"
                  >
                    <div className="flex flex-1 flex-col gap-0.5">
                      <span className="text-sm font-medium">{run.model_display_name}</span>
                      <span className="text-xs text-muted-foreground">
                        {run.correct_count}/{run.total_questions} correct · {(run.avg_time_ms / 1000).toFixed(1)}s avg
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground/50">
                      {new Date(run.completed_at).toLocaleDateString()}
                    </span>
                    <span
                      className={`w-12 text-right text-sm font-medium tabular-nums ${
                        accuracy >= 70
                          ? "text-green-600"
                          : accuracy >= 40
                            ? "text-yellow-600"
                            : "text-red-600"
                      }`}
                    >
                      {accuracy}%
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
