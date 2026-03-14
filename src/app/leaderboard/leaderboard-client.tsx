"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface SpeedRow {
  id: string;
  model_display_name: string;
  tokens_per_second: number;
  gpu_device: string | null;
  device_class: string | null;
  browser: string | null;
  os: string | null;
  completed_at: string;
  profiles: { username: string | null } | null;
}

interface AccuracyRow {
  id: string;
  model_display_name: string;
  accuracy: number;
  efficiency_score: number;
  correct_count: number;
  total_questions: number;
  completed_at: string;
  profiles: { username: string | null } | null;
}

interface RecentRow {
  id: string;
  model_display_name: string;
  tokens_per_second: number | null;
  efficiency_score: number | null;
  accuracy: number;
  device_class: string | null;
  completed_at: string;
  profiles: { username: string | null } | null;
}

const DEVICE_CLASS_LABELS: Record<string, string> = {
  "apple-silicon": "apple silicon",
  nvidia: "nvidia",
  amd: "amd",
  intel: "intel",
  mobile: "mobile",
  unknown: "unknown",
};

function formatTimeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function accuracyColor(pct: number) {
  if (pct >= 70) return "text-green-600";
  if (pct >= 40) return "text-yellow-600";
  return "text-red-600";
}

export function LeaderboardClient({
  initialSpeed,
  initialAccuracy,
  initialRecent,
}: {
  initialSpeed: SpeedRow[];
  initialAccuracy: AccuracyRow[];
  initialRecent: RecentRow[];
}) {
  const [tab, setTab] = useState<"speed" | "accuracy">("speed");
  const [recent, setRecent] = useState<RecentRow[]>(initialRecent);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("reports-feed")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "reports" },
        (payload) => {
          const row = payload.new as RecentRow & { id: string };
          setRecent((prev) => [row, ...prev].slice(0, 20));
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <div className="flex flex-col gap-12">
      {/* tabs */}
      <div className="flex flex-col gap-6">
        <div className="flex gap-1 border-b">
          <button
            onClick={() => setTab("speed")}
            className={`px-4 py-2 text-xs transition-colors ${
              tab === "speed"
                ? "border-b border-foreground text-foreground -mb-px"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            speed
          </button>
          <button
            onClick={() => setTab("accuracy")}
            className={`px-4 py-2 text-xs transition-colors ${
              tab === "accuracy"
                ? "border-b border-foreground text-foreground -mb-px"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            efficiency
          </button>
        </div>

        {tab === "speed" && (
          <div className="flex flex-col gap-3">
            <p className="text-xs text-muted-foreground">
              fastest devices · measured in tokens per second · same model for all
            </p>
            {initialSpeed.length === 0 ? (
              <p className="text-sm text-muted-foreground/50">no runs yet — be the first</p>
            ) : (
              <div className="flex flex-col border">
                {initialSpeed.map((row, i) => (
                  <Link
                    key={row.id}
                    href={`/report/${row.id}`}
                    className="flex items-center gap-4 border-b px-5 py-4 last:border-b-0 transition-colors hover:bg-accent/20"
                  >
                    <span className="w-6 shrink-0 font-mono text-xs text-muted-foreground/40">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="text-sm font-medium truncate">
                        {row.gpu_device && row.gpu_device !== "unknown"
                          ? row.gpu_device
                          : DEVICE_CLASS_LABELS[row.device_class ?? "unknown"] ?? "unknown device"}
                      </span>
                      <span className="text-[10px] text-muted-foreground/50">
                        {row.browser} · {row.os} · {row.model_display_name}
                      </span>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground/50">
                      {row.profiles?.username ?? "—"}
                    </span>
                    <span className="w-24 shrink-0 text-right text-sm font-medium tabular-nums">
                      {row.tokens_per_second.toFixed(1)}{" "}
                      <span className="text-xs font-normal text-muted-foreground">tok/s</span>
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "accuracy" && (
          <div className="flex flex-col gap-3">
            <p className="text-xs text-muted-foreground">
              efficiency score = accuracy% ÷ √params · rewards small models that punch above weight
            </p>
            {initialAccuracy.length === 0 ? (
              <p className="text-sm text-muted-foreground/50">no runs yet — be the first</p>
            ) : (
              <div className="flex flex-col border">
                {initialAccuracy.map((row, i) => {
                  const accuracy = Math.round(row.accuracy * 100);
                  return (
                    <Link
                      key={row.id}
                      href={`/report/${row.id}`}
                      className="flex items-center gap-4 border-b px-5 py-4 last:border-b-0 transition-colors hover:bg-accent/20"
                    >
                      <span className="w-6 shrink-0 font-mono text-xs text-muted-foreground/40">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="flex-1 text-sm font-medium">{row.model_display_name}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {row.correct_count}/{row.total_questions}
                      </span>
                      <span className={`shrink-0 text-xs tabular-nums ${accuracyColor(accuracy)}`}>
                        {accuracy}%
                      </span>
                      <span className="w-16 shrink-0 text-right text-sm font-medium tabular-nums">
                        {row.efficiency_score.toFixed(1)}{" "}
                        <span className="text-[10px] font-normal text-muted-foreground">eff</span>
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* live feed */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">recent runs</span>
          <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[10px] text-muted-foreground/50">live</span>
        </div>
        {recent.length === 0 ? (
          <p className="text-sm text-muted-foreground/50">no runs yet</p>
        ) : (
          <div className="flex flex-col border">
            {recent.map((row) => {
              const accuracy = Math.round(row.accuracy * 100);
              return (
                <Link
                  key={row.id}
                  href={`/report/${row.id}`}
                  className="flex items-center gap-4 border-b px-5 py-3 last:border-b-0 transition-colors hover:bg-accent/20"
                >
                  <span className="flex-1 text-sm">{row.model_display_name}</span>
                  {row.tokens_per_second != null && (
                    <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                      {row.tokens_per_second.toFixed(1)} tok/s
                    </span>
                  )}
                  <span className="shrink-0 text-xs text-muted-foreground/50">
                    {row.profiles?.username ?? "—"}
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground/40">
                    {formatTimeAgo(row.completed_at)}
                  </span>
                  <span className={`w-12 shrink-0 text-right text-sm font-medium tabular-nums ${accuracyColor(accuracy)}`}>
                    {accuracy}%
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
