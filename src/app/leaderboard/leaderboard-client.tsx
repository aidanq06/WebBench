"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { ChevronDown } from "lucide-react";
import { modelLogo } from "@/lib/webllm/models";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface RunRow {
  id: string;
  accuracy: number;
  correct_count: number;
  total_questions: number;
  tokens_per_second: number | null;
  completed_at: string;
  profiles: { username: string | null } | null;
}

export interface ModelAggregate {
  modelId: string;
  displayName: string;
  runCount: number;
  avgAccuracy: number;
  subjectAvgs: { cs: number; engineering: number; math: number; science: number };
  difficultyAvgs: { easy: number; medium: number; hard: number };
  bestAccuracy: number;
  recentRuns: RunRow[];
}

export interface SpeedRow {
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

export interface RecentRow {
  id: string;
  model_display_name: string;
  tokens_per_second: number | null;
  efficiency_score: number | null;
  accuracy: number;
  device_class: string | null;
  completed_at: string;
  profiles: { username: string | null } | null;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const SUBJECTS = ["cs", "engineering", "math", "science"] as const;

const SUBJECT_TEXT: Record<typeof SUBJECTS[number], string> = {
  cs:          "text-blue-500",
  engineering: "text-orange-500",
  math:        "text-emerald-500",
  science:     "text-purple-500",
};

const SUBJECT_BAR: Record<typeof SUBJECTS[number], string> = {
  cs:          "bg-blue-500",
  engineering: "bg-orange-500",
  math:        "bg-emerald-500",
  science:     "bg-purple-500",
};

const DEVICE_CLASS_LABELS: Record<string, string> = {
  "apple-silicon": "apple silicon",
  nvidia: "nvidia",
  amd: "amd",
  intel: "intel",
  mobile: "mobile",
  unknown: "unknown",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatTimeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function AccuracyBar({ pct }: { pct: number }) {
  const color = pct >= 60 ? "bg-green-500" : pct >= 40 ? "bg-yellow-500" : "bg-red-500";
  return (
    <div className="relative h-[3px] w-20 bg-muted">
      <motion.div
        className={`absolute inset-y-0 left-0 ${color}`}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      />
    </div>
  );
}

// ── Model detail accordion ────────────────────────────────────────────────────

function ModelDetail({ model, visible }: { model: ModelAggregate; visible: boolean }) {
  return (
    <AnimatePresence initial={false}>
      {visible && (
        <motion.div
          key="shell"
          initial={{ height: 0 }}
          animate={{ height: "auto" }}
          exit={{ height: 0 }}
          transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
          className="overflow-hidden border-t border-border/20"
        >
          {/* inner content fades + rises in after the shell opens */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.25, delay: 0.14, ease: "easeOut" }}
            className="grid grid-cols-1 gap-8 px-8 py-7 sm:grid-cols-[1fr_auto]"
          >
            {/* subject bars */}
            <div className="flex flex-col gap-4">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground/30">subject accuracy</p>
              <div className="flex flex-col gap-3">
                {SUBJECTS.map((subj) => {
                  const pct = Math.round(model.subjectAvgs[subj] * 100);
                  return (
                    <div key={subj} className="flex items-center gap-4">
                      <span className={`w-20 shrink-0 text-xs ${SUBJECT_TEXT[subj]}`}>{subj}</span>
                      <div className="relative h-[3px] flex-1 rounded-full bg-muted">
                        <motion.div
                          className={`absolute inset-y-0 left-0 rounded-full ${SUBJECT_BAR[subj]}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
                        />
                      </div>
                      <span className="w-9 shrink-0 text-right text-xs tabular-nums text-muted-foreground/60">
                        {pct}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* difficulty + meta */}
            <div className="flex flex-col gap-4 sm:min-w-[200px]">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground/30">difficulty</p>
              <div className="flex gap-8">
                {(["easy", "medium", "hard"] as const).map((d) => {
                  const pct = Math.round(model.difficultyAvgs[d] * 100);
                  return (
                    <div key={d} className="flex flex-col gap-0.5">
                      <span className="text-xl font-semibold tabular-nums">{pct}%</span>
                      <span className="text-[10px] text-muted-foreground/40">{d}</span>
                    </div>
                  );
                })}
              </div>

              <div className="mt-2 flex flex-col gap-1">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground/30">runs</p>
                <span className="text-2xl font-semibold tabular-nums">{model.runCount}</span>
              </div>
            </div>

            {/* runs list — full width below */}
            <div className="col-span-full flex flex-col gap-3 border-t border-border/20 pt-6">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground/30">run history</p>
              <div className="divide-y divide-border/15">
                {model.recentRuns.map((run) => {
                  const pct = Math.round(run.accuracy * 100);
                  return (
                    <Link
                      key={run.id}
                      href={`/report/${run.id}`}
                      className="flex items-center gap-5 py-2.5 transition-colors hover:bg-accent/10"
                    >
                      <span className="flex-1 text-xs text-muted-foreground/50">
                        {formatTimeAgo(run.completed_at)}
                      </span>
                      <span className="shrink-0 text-xs text-muted-foreground/35">
                        {run.profiles?.username ?? "—"}
                      </span>
                      <span className="shrink-0 font-mono text-xs text-muted-foreground/40 tabular-nums">
                        {run.correct_count}/{run.total_questions}
                      </span>
                      {run.tokens_per_second != null && (
                        <span className="shrink-0 text-xs text-muted-foreground/30 tabular-nums">
                          {run.tokens_per_second.toFixed(1)} tok/s
                        </span>
                      )}
                      <span className="shrink-0 w-10 text-right text-sm font-semibold tabular-nums">
                        {pct}%
                      </span>
                      <span className="shrink-0 text-xs text-muted-foreground/25">→</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Models tab ────────────────────────────────────────────────────────────────

function ModelsTab({ models }: { models: ModelAggregate[] }) {
  const [openModel, setOpenModel] = useState<string | null>(null);

  if (models.length === 0) {
    return (
      <p className="text-sm text-muted-foreground/50">
        no runs yet — be the first to{" "}
        <Link href="/benchmark" className="underline underline-offset-2">
          run the benchmark
        </Link>
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-muted-foreground/40">
        community averages · click a row to expand
      </p>

      {/* column headers */}
      <div className="flex items-center gap-3 border-b border-border/30 px-2 pb-2.5">
        <span className="w-7 shrink-0" />
        <span className="w-4 shrink-0" />
        <span className="flex-1 text-[10px] uppercase tracking-widest text-muted-foreground/30">model</span>
        {SUBJECTS.map((s) => (
          <span
            key={s}
            className={`hidden w-14 shrink-0 text-right text-[10px] uppercase tracking-widest sm:block ${SUBJECT_TEXT[s]} opacity-40`}
          >
            {s === "engineering" ? "eng" : s}
          </span>
        ))}
        <span className="hidden w-20 shrink-0 sm:block" />
        <span className="w-12 shrink-0 text-right text-[10px] uppercase tracking-widest text-muted-foreground/30">avg</span>
        <span className="hidden w-8 shrink-0 text-right text-[10px] uppercase tracking-widest text-muted-foreground/30 sm:block">n</span>
        <span className="w-4 shrink-0" />
      </div>

      {/* rows */}
      <div className="divide-y divide-border/15">
        {models.map((model, i) => {
          const isOpen = openModel === model.modelId;
          const overall = Math.round(model.avgAccuracy * 100);
          return (
            <div key={model.modelId}>
              <button
                className={`flex w-full items-center gap-3 rounded-sm px-2 py-3.5 text-left transition-colors hover:bg-accent/10 ${isOpen ? "bg-accent/5" : ""}`}
                onClick={() => setOpenModel(isOpen ? null : model.modelId)}
              >
                <span className="w-7 shrink-0 font-mono text-xs text-muted-foreground/20">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {(() => {
                  const logo = modelLogo(model.modelId);
                  return logo ? (
                    <img src={logo} alt="" className="h-4 w-4 shrink-0 object-contain" />
                  ) : (
                    <span className="h-4 w-4 shrink-0" />
                  );
                })()}
                <span className="flex-1 text-sm font-medium">{model.displayName}</span>
                {SUBJECTS.map((s) => {
                  const pct = Math.round(model.subjectAvgs[s] * 100);
                  return (
                    <span
                      key={s}
                      className={`hidden w-14 shrink-0 text-right text-xs tabular-nums sm:block ${SUBJECT_TEXT[s]}`}
                    >
                      {pct}%
                    </span>
                  );
                })}
                <AccuracyBar pct={overall} />
                <span className="w-12 shrink-0 text-right text-sm font-semibold tabular-nums">
                  {overall}%
                </span>
                <span className="hidden w-8 shrink-0 text-right text-xs text-muted-foreground/25 tabular-nums sm:block">
                  {model.runCount}
                </span>
                <motion.span
                  className="w-4 shrink-0 flex justify-center text-muted-foreground/25"
                  animate={{ rotate: isOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                </motion.span>
              </button>

              <ModelDetail model={model} visible={isOpen} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Hardware tab ──────────────────────────────────────────────────────────────

function HardwareTab({ rows }: { rows: SpeedRow[] }) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-muted-foreground/40">
        fastest devices · tokens per second · sign in to appear
      </p>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground/50">no runs yet</p>
      ) : (
        <div className="divide-y divide-border/15">
          {rows.map((row, i) => (
            <Link
              key={row.id}
              href={`/report/${row.id}`}
              className="flex items-center gap-4 px-2 py-3.5 transition-colors hover:bg-accent/10"
            >
              <span className="w-7 shrink-0 font-mono text-xs text-muted-foreground/20">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="truncate text-sm font-medium">
                  {row.gpu_device && row.gpu_device !== "unknown"
                    ? row.gpu_device
                    : DEVICE_CLASS_LABELS[row.device_class ?? "unknown"] ?? "unknown device"}
                </span>
                <span className="text-[10px] text-muted-foreground/35">
                  {row.browser} · {row.os} · {row.model_display_name}
                </span>
              </div>
              <span className="shrink-0 text-xs text-muted-foreground/35">
                {row.profiles?.username ?? "—"}
              </span>
              <span className="shrink-0 text-sm font-semibold tabular-nums">
                {row.tokens_per_second.toFixed(1)}
                <span className="ml-1 text-xs font-normal text-muted-foreground/40">tok/s</span>
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Recent tab ────────────────────────────────────────────────────────────────

function RecentTab({ rows }: { rows: RecentRow[] }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground/40">live feed</span>
        <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground/50">no runs yet</p>
      ) : (
        <div className="divide-y divide-border/15">
          {rows.map((row) => {
            const pct = Math.round(row.accuracy * 100);
            return (
              <Link
                key={row.id}
                href={`/report/${row.id}`}
                className="flex items-center gap-4 px-2 py-3.5 transition-colors hover:bg-accent/10"
              >
                <span className="flex-1 text-sm font-medium">{row.model_display_name}</span>
                {row.tokens_per_second != null && (
                  <span className="shrink-0 text-xs text-muted-foreground/35 tabular-nums">
                    {row.tokens_per_second.toFixed(1)} tok/s
                  </span>
                )}
                <span className="shrink-0 text-xs text-muted-foreground/35">
                  {row.profiles?.username ?? "—"}
                </span>
                <span className="shrink-0 text-xs text-muted-foreground/25">
                  {formatTimeAgo(row.completed_at)}
                </span>
                <span className="w-12 shrink-0 text-right text-sm font-semibold tabular-nums">
                  {pct}%
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

type Tab = "models" | "hardware" | "recent";

export function LeaderboardClient({
  models,
  initialSpeed,
  initialRecent,
}: {
  models: ModelAggregate[];
  initialSpeed: SpeedRow[];
  initialRecent: RecentRow[];
}) {
  const [tab, setTab] = useState<Tab>("models");
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

  const TABS: { id: Tab; label: string }[] = [
    { id: "models", label: "models" },
    { id: "hardware", label: "hardware" },
    { id: "recent", label: "recent" },
  ];

  return (
    <div className="flex flex-col gap-8">
      {/* tab nav */}
      <div className="flex gap-6 border-b border-border/20 pb-0">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`pb-3 text-sm transition-colors ${
              tab === t.id
                ? "border-b-2 border-foreground/70 text-foreground -mb-px"
                : "text-muted-foreground/40 hover:text-muted-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "models"   && <ModelsTab models={models} />}
      {tab === "hardware" && <HardwareTab rows={initialSpeed} />}
      {tab === "recent"   && <RecentTab rows={recent} />}
    </div>
  );
}
