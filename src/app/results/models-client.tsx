"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { getLocalRuns } from "@/lib/storage/local-runs";
import { AVAILABLE_MODELS, ModelOption, modelLogo } from "@/lib/webllm/models";
import { PUBLISHED_BASELINES } from "@/lib/benchmark/published-baselines";
import { PageStagger, PageStaggerItem } from "@/components/layout/PageStagger";
import type { BenchmarkReport } from "@/types/report";
import type { ModelAggregate, RecentRun } from "@/lib/supabase/queries";

// ── Theme constants ─────────────────────────────────────────────────────────
const EASE_OUT_EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1];

const SUBJECT_COLORS: Record<string, string> = {
  cs: "bg-blue-500/70",
  engineering: "bg-orange-500/70",
  math: "bg-emerald-500/70",
  science: "bg-purple-500/70",
};

const DEVICE_LABEL: Record<string, string> = {
  "apple-silicon": "apple silicon",
  "nvidia": "nvidia",
  "amd": "amd",
  "intel": "intel",
  "mobile": "mobile",
  "unknown": "other",
};

const LABEL = "font-mono text-[9px] uppercase tracking-widest text-[--fg-subtle]";
const RUNS_PAGE = 12;

// Published frontier reference, shown beneath the ranking on the same scale so
// the gap above the best browser model is felt inline (no chart).
const FRONTIER_NAMES = ["Claude 3.5 Sonnet", "Llama 3.1 70B", "GPT-3.5 Turbo"];
const FRONTIER = FRONTIER_NAMES
  .map((name) => PUBLISHED_BASELINES.find((b) => b.name === name))
  .filter((b): b is NonNullable<typeof b> => !!b)
  .sort((a, b) => b.accuracy - a.accuracy);

// Shared column template — ranking rows and frontier rows align to this grid.
// Fixed name column so the bar starts at the same x on every row (no gap from
// short names); the bar takes the remaining flexible width.
const ROW_GRID = "grid w-full grid-cols-[2rem_1.25rem_13rem_1fr_5.5rem] items-center gap-4";

// Gridline positions (absolute 0–100% scale, shared by ranking + frontier bars).
const GRIDLINES = [25, 50, 75];

// One accuracy bar on the shared 0–100% scale, with faint gridlines crossing it.
// `fill` colors the bar; it fills to `pct`. When `label` is set, the value floats
// minimally right above the point the fill ends — annotating the bar in place.
function BarTrack({
  pct,
  fill,
  reveal,
  delay = 0,
  label,
  children,
}: {
  pct: number;
  fill: string;
  reveal: boolean;
  delay?: number;
  label?: string;
  children?: React.ReactNode;
}) {
  return (
    <span className="relative block h-full self-stretch">
      {/* 3px track, vertically centered in the row */}
      <span className="absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 bg-foreground/8" />
      <motion.span
        className={`absolute top-1/2 left-0 h-[3px] -translate-y-1/2 ${fill}`}
        initial={{ width: 0 }}
        animate={reveal ? { width: `${pct}%` } : { width: 0 }}
        transition={{ duration: 0.7, delay, ease: EASE_OUT_EXPO }}
      />
      {/* gridlines crossing the full row height */}
      {GRIDLINES.map((g) => (
        <span
          key={g}
          aria-hidden
          className="absolute inset-y-[6px] w-px bg-foreground/[0.12]"
          style={{ left: `${g}%` }}
        />
      ))}
      {/* value floated right above the fill end */}
      {label && (
        <motion.span
          className="absolute z-10 -translate-x-1/2 whitespace-nowrap font-mono text-[9px] tabular-nums text-foreground/75"
          style={{ left: `${pct}%`, bottom: "calc(50% + 4px)" }}
          initial={{ opacity: 0 }}
          animate={reveal ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.4, delay: delay + 0.25, ease: EASE_OUT_EXPO }}
        >
          {label}
        </motion.span>
      )}
      {children}
    </span>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────
function formatSize(mb: number): string {
  return mb >= 1000 ? `${(mb / 1024).toFixed(1)} GB` : `${mb} MB`;
}

function formatTimeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function findPublishedBaseline(modelId: string) {
  const id = modelId.toLowerCase();
  if (id.includes("llama-3.2-3b")) return PUBLISHED_BASELINES.find((b) => b.name === "Llama 3.2 3B");
  if (id.includes("llama-3.2-1b")) return PUBLISHED_BASELINES.find((b) => b.name === "Llama 3.2 1B");
  if (id.includes("gemma-2-2b")) return PUBLISHED_BASELINES.find((b) => b.name === "Gemma 2 2B");
  if (id.includes("phi-3.5")) return PUBLISHED_BASELINES.find((b) => b.name === "Phi-3.5 Mini");
  if (id.includes("mistral-7b")) return PUBLISHED_BASELINES.find((b) => b.name === "Mistral 7B");
  return undefined;
}

interface LocalSummary {
  runCount: number;
  bestAccuracy: number;
  latestRunId: string;
  latestCompletedAt: string;
}

function aggregateLocal(reports: BenchmarkReport[]): Map<string, LocalSummary> {
  const map = new Map<string, BenchmarkReport[]>();
  for (const r of reports) {
    const arr = map.get(r.modelId) ?? [];
    arr.push(r);
    map.set(r.modelId, arr);
  }
  const out = new Map<string, LocalSummary>();
  for (const [modelId, runs] of map) {
    const sorted = [...runs].sort((a, b) => b.overallAccuracy - a.overallAccuracy);
    const newest = [...runs].sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())[0];
    out.set(modelId, {
      runCount: runs.length,
      bestAccuracy: sorted[0].overallAccuracy,
      latestRunId: newest.runId,
      latestCompletedAt: newest.completedAt,
    });
  }
  return out;
}

// ── Paginated runs list (collapsed by default; user opts in to see them) ─────
function RunsList({ modelId, runCount }: { modelId: string; runCount: number }) {
  const [revealed, setRevealed] = useState(false);
  const [runs, setRuns] = useState<RecentRun[]>([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [errored, setErrored] = useState(false);
  const startedRef = useRef(false);

  async function fetchPage(nextOffset: number) {
    try {
      const res = await fetch(
        `/api/runs?model=${encodeURIComponent(modelId)}&limit=${RUNS_PAGE}&offset=${nextOffset}`,
      );
      if (!res.ok) throw new Error(String(res.status));
      const data: { runs: RecentRun[]; hasMore: boolean } = await res.json();
      setRuns((prev) => (nextOffset === 0 ? data.runs : [...prev, ...data.runs]));
      setHasMore(data.hasMore);
      setOffset(nextOffset + data.runs.length);
    } catch {
      setErrored(true);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }

  // Fetch only after the user opts in — never on open alone.
  useEffect(() => {
    if (revealed && !startedRef.current) {
      startedRef.current = true;
      void fetchPage(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revealed]);

  function loadMore() {
    setLoadingMore(true);
    void fetchPage(offset);
  }

  // Collapsed by default so the section isn't an overwhelming wall of runs.
  if (!revealed) {
    return (
      <button
        onClick={() => setRevealed(true)}
        className="self-start font-mono text-[10px] text-[--fg-subtle] underline-offset-4 transition-colors hover:text-foreground hover:underline"
      >
        show all {runCount} run{runCount === 1 ? "" : "s"} ↓
      </button>
    );
  }

  // Skeleton holds a stable height so the row doesn't pop when runs arrive.
  if (loading) {
    return (
      <div className="flex flex-col divide-y divide-[--border]">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between py-2">
            <span className="h-2 w-24 rounded-sm bg-foreground/[0.06]" />
            <span className="h-2 w-10 rounded-sm bg-foreground/[0.06]" />
          </div>
        ))}
      </div>
    );
  }
  if (errored) {
    return <span className="font-mono text-[10px] text-[--fg-subtle]">couldn’t load runs</span>;
  }
  if (runs.length === 0) {
    return <span className="font-mono text-[10px] text-[--fg-subtle]">no runs yet</span>;
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col divide-y divide-[--border]">
        {runs.map((r) => (
          <div
            key={r.runId}
            className="grid grid-cols-[1fr_5rem_3.5rem_3.5rem] items-center gap-3 py-2"
          >
            <span className="font-mono text-[10px] text-[--fg-subtle]">
              {formatTimeAgo(r.completedAt)}
            </span>
            <span className="font-mono text-[10px] text-[--fg-subtle]">
              {DEVICE_LABEL[r.deviceClass ?? "unknown"] ?? r.deviceClass}
            </span>
            <span className="text-right font-mono text-[10px] tabular-nums text-[--fg-subtle]">
              {r.correctCount}/{r.totalQuestions}q
            </span>
            <span className="text-right font-mono text-sm tabular-nums">
              {r.score}
              <span className="text-[10px] text-[--fg-subtle]">%</span>
            </span>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-4">
        {hasMore && (
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="font-mono text-[10px] text-[--fg-subtle] underline-offset-4 transition-colors hover:text-foreground hover:underline disabled:opacity-50"
          >
            {loadingMore ? "loading…" : "load more ↓"}
          </button>
        )}
        {!hasMore && runs.length > RUNS_PAGE && (
          <span className="font-mono text-[10px] text-[--fg-subtle]/60">that’s all</span>
        )}
        <button
          onClick={() => setRevealed(false)}
          className="font-mono text-[10px] text-[--fg-subtle] underline-offset-4 transition-colors hover:text-foreground hover:underline"
        >
          hide ↑
        </button>
      </div>
    </div>
  );
}

// ── Inline detail (expanded under a row) ─────────────────────────────────────
function RowDetail({
  model,
  aggregate,
  local,
  active,
}: {
  model: ModelOption;
  aggregate: ModelAggregate | undefined;
  local: LocalSummary | undefined;
  active: boolean;
}) {
  const baseline = findPublishedBaseline(model.id);
  const hasAnyData = !!aggregate || !!local;
  const subjectEntries = aggregate
    ? Object.entries(aggregate.subjectAvgs).sort((a, b) => b[1] - a[1])
    : [];
  const hardwareEntries = aggregate
    ? Object.entries(aggregate.hardwareBreakdown).sort((a, b) => b[1] - a[1])
    : [];

  return (
    <div className="flex flex-col gap-5 pl-[3.25rem] pr-2 pb-7 pt-4">
      {/* spec line */}
      <p className="font-mono text-[10px] text-[--fg-subtle]">
        {model.parameterCount}
        <span className="mx-1.5">·</span>
        {formatSize(model.estimatedSizeMB)} download
        <span className="mx-1.5">·</span>
        ~{formatSize(model.minVramMB)} vram
      </p>

      {/* stat strip */}
      <div className="grid grid-cols-3 gap-6 border-t border-[--border] pt-5">
        <div className="flex flex-col gap-1">
          <span className={LABEL}>community</span>
          {aggregate ? (
            <>
              <span className="font-mono text-xl tabular-nums">
                {Math.round(aggregate.avgAccuracy * 100)}
                <span className="ml-0.5 text-[10px] text-[--fg-subtle]">%</span>
              </span>
              <span className="font-mono text-[10px] text-[--fg-subtle]">
                avg · n={aggregate.runCount}
              </span>
            </>
          ) : (
            <span className="font-mono text-[10px] text-[--fg-subtle]">no runs yet</span>
          )}
        </div>
        <div className="flex flex-col gap-1">
          <span className={LABEL}>your best</span>
          {local ? (
            <>
              <span className="font-mono text-xl tabular-nums">
                {Math.round(local.bestAccuracy * 100)}
                <span className="ml-0.5 text-[10px] text-[--fg-subtle]">%</span>
              </span>
              <span className="font-mono text-[10px] text-[--fg-subtle]">
                {local.runCount} run{local.runCount !== 1 ? "s" : ""}
              </span>
            </>
          ) : (
            <span className="font-mono text-[10px] text-[--fg-subtle]">
              not yet on this device
            </span>
          )}
        </div>
        <div className="flex flex-col gap-1">
          <span className={LABEL}>published</span>
          {baseline ? (
            <>
              <span className="font-mono text-xl tabular-nums text-muted-foreground">
                {Math.round(baseline.accuracy * 100)}
                <span className="ml-0.5 text-[10px] text-[--fg-subtle]">%</span>
              </span>
              <span className="font-mono text-[10px] text-[--fg-subtle]">{baseline.source}</span>
            </>
          ) : (
            <span className="font-mono text-[10px] text-[--fg-subtle]">no reference</span>
          )}
        </div>
      </div>

      {/* subject bars */}
      {subjectEntries.length > 0 && (
        <div className="flex flex-col gap-3 border-t border-[--border] pt-5">
          <span className={LABEL}>accuracy by subject</span>
          {subjectEntries.map(([subject, acc], i) => (
            <div key={subject} className="flex items-center gap-3">
              <span className="w-24 text-xs text-muted-foreground">{subject}</span>
              <span className="relative block h-px flex-1 bg-foreground/10">
                <motion.span
                  className={`absolute inset-y-0 left-0 ${SUBJECT_COLORS[subject] ?? "bg-foreground/60"}`}
                  initial={{ width: 0 }}
                  animate={{ width: active ? `${Math.round(acc * 100)}%` : 0 }}
                  transition={{ duration: 0.55, delay: active ? 0.12 + 0.08 * i : 0, ease: EASE_OUT_EXPO }}
                />
              </span>
              <span className="w-10 text-right font-mono text-[10px] tabular-nums text-[--fg-subtle]">
                {Math.round(acc * 100)}%
              </span>
            </div>
          ))}
        </div>
      )}

      {/* compact stats row */}
      {aggregate && (
        <div className="grid grid-cols-3 gap-6 border-t border-[--border] pt-5">
          <div className="flex flex-col gap-1">
            <span className={LABEL}>best run</span>
            <span className="font-mono text-sm tabular-nums">
              {Math.round(aggregate.bestAccuracy * 100)}%
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className={LABEL}>median tok/s</span>
            <span className="font-mono text-sm tabular-nums">
              {aggregate.medianTokPerSec.toFixed(1)}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className={LABEL}>questions tested</span>
            <span className="font-mono text-sm tabular-nums">{aggregate.totalQuestions}</span>
          </div>
        </div>
      )}

      {/* hardware mix */}
      {hardwareEntries.length > 0 && (
        <div className="flex flex-col gap-2 border-t border-[--border] pt-5">
          <span className={LABEL}>hardware mix</span>
          <div className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-[10px] text-[--fg-subtle]">
            {hardwareEntries.map(([dc, count]) => (
              <span key={dc}>
                <span className="tabular-nums text-foreground/80">{count}×</span>{" "}
                {DEVICE_LABEL[dc] ?? dc}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* runs — paginated, fetched on open */}
      {aggregate && (
        <div className="flex flex-col gap-2 border-t border-[--border] pt-5">
          <span className={LABEL}>runs</span>
          <RunsList modelId={model.id} runCount={aggregate.runCount} />
        </div>
      )}

      {/* your last run link */}
      {local && (
        <Link
          href={`/report/${local.latestRunId}`}
          className="font-mono text-[10px] text-[--fg-subtle] underline-offset-4 transition-colors hover:text-muted-foreground hover:underline"
        >
          your last run ({formatTimeAgo(local.latestCompletedAt)}) →
        </Link>
      )}

      {!hasAnyData && (
        <div className="flex flex-col gap-3 border-t border-[--border] pt-5">
          <p className="text-xs text-[--fg-subtle]">
            no runs for this model yet — be the first.
          </p>
          <Link
            href="/benchmark"
            className="self-start border border-[--border] px-4 py-1.5 font-mono text-[10px] transition-colors hover:bg-foreground/5"
          >
            run benchmark →
          </Link>
        </div>
      )}
    </div>
  );
}

// ── Ranking row (header button + inline expand) ──────────────────────────────
function RankingRow({
  rank,
  model,
  aggregate,
  local,
  index,
  isLeader,
  isOpen,
  onToggle,
}: {
  rank: number;
  model: ModelOption;
  aggregate: ModelAggregate | undefined;
  local: LocalSummary | undefined;
  index: number;
  isLeader: boolean;
  isOpen: boolean;
  onToggle: (modelId: string) => void;
}) {
  const logo = modelLogo(model.id);
  const pct = aggregate ? Math.round(aggregate.avgAccuracy * 100) : 0;
  const localPct = local ? Math.round(local.bestAccuracy * 100) : null;
  const ref = useRef<HTMLButtonElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -40px 0px" });

  return (
    <div className="border-b border-[--border] last:border-b-0">
      <button
        ref={ref}
        onClick={() => onToggle(model.id)}
        aria-expanded={isOpen}
        className={`${ROW_GRID} py-4 text-left transition-colors ${
          isOpen ? "bg-foreground/[0.025]" : "hover:bg-foreground/[0.025]"
        }`}
      >
        <span
          className={`font-mono text-[10px] tabular-nums ${
            isLeader ? "text-foreground" : "text-[--fg-subtle]"
          }`}
        >
          {String(rank).padStart(2, "0")}
        </span>
        {logo ? (
          <img src={logo} alt="" className="h-4 w-4 object-contain opacity-90" />
        ) : (
          <span className="h-4 w-4" />
        )}
        <span className="flex items-baseline gap-2 min-w-0">
          <span className={`truncate text-sm ${isLeader ? "font-medium" : ""}`}>
            {model.displayName}
          </span>
          <span className="font-mono text-[10px] text-[--fg-subtle]">{model.parameterCount}</span>
          {isLeader && (
            <span className="font-mono text-[9px] uppercase tracking-widest text-[--fg-subtle]">
              leading
            </span>
          )}
        </span>
        <BarTrack
          pct={pct}
          fill={isLeader ? "bg-foreground" : "bg-foreground/70"}
          reveal={inView}
          delay={0.06 * index}
          label={aggregate ? `${pct}%` : undefined}
        >
          {/* your-best marker — personal data woven into the community bar */}
          {localPct !== null && (
            <motion.span
              className="absolute top-1/2 z-10 h-2.5 w-px -translate-x-1/2 -translate-y-1/2 bg-foreground"
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : { opacity: 0 }}
              transition={{ duration: 0.4, delay: 0.06 * index + 0.25, ease: EASE_OUT_EXPO }}
              style={{ left: `${localPct}%` }}
              title={`your best · ${localPct}%`}
            />
          )}
        </BarTrack>
        <span className="text-right font-mono text-[10px] text-[--fg-subtle]">
          {aggregate ? `${aggregate.runCount} runs` : "no runs"}
        </span>
      </button>

      {/* Smooth, jolt-free expand: CSS grid-rows 0fr↔1fr (never measures height). */}
      <div
        className="grid transition-[grid-template-rows] duration-[420ms] [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none"
        style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
      >
        <div
          className={`min-h-0 overflow-hidden transition-opacity duration-300 ${
            isOpen ? "opacity-100 delay-75" : "opacity-0"
          }`}
        >
          <RowDetail model={model} aggregate={aggregate} local={local} active={isOpen} />
        </div>
      </div>
    </div>
  );
}

// ── Frontier reference row (non-interactive, greyed) ─────────────────────────
function FrontierRow({
  name,
  accuracy,
  source,
  index,
}: {
  name: string;
  accuracy: number;
  source: string;
  index: number;
}) {
  const pct = Math.round(accuracy * 100);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -40px 0px" });
  return (
    <div ref={ref} className={`${ROW_GRID} py-3.5`}>
      <span className="font-mono text-[10px] text-[--fg-subtle]/60">—</span>
      <span className="h-4 w-4" />
      <span className="truncate text-sm text-muted-foreground">{name.toLowerCase()}</span>
      <BarTrack
        pct={pct}
        fill="bg-foreground/25"
        reveal={inView}
        delay={0.06 * index}
        label={`${pct}%`}
      />
      <span className="truncate text-right font-mono text-[9px] text-[--fg-subtle]/55">
        {source.toLowerCase()}
      </span>
    </div>
  );
}

// ── Main client ────────────────────────────────────────────────────────────
export function ModelsClient({ stats }: { stats: ModelAggregate[] }) {
  const [localSummaries, setLocalSummaries] = useState<Map<string, LocalSummary>>(new Map());
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());

  const toggle = (id: string) =>
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  useEffect(() => {
    setLocalSummaries(aggregateLocal(getLocalRuns()));
  }, []);

  const aggregateById = useMemo(() => {
    const m = new Map<string, ModelAggregate>();
    for (const a of stats) m.set(a.modelId, a);
    return m;
  }, [stats]);

  // Ranking: community avg accuracy desc, then local-best, then unknown last.
  const ranked = useMemo(() => {
    const items = AVAILABLE_MODELS.map((model) => {
      const agg = aggregateById.get(model.id);
      const local = localSummaries.get(model.id);
      const acc = agg?.avgAccuracy ?? local?.bestAccuracy ?? -1;
      return { model, agg, local, acc };
    });
    items.sort((a, b) => b.acc - a.acc);
    return items;
  }, [aggregateById, localSummaries]);

  // The leader is the highest-ranked model that actually has community data.
  const leaderId = ranked.find((r) => r.agg)?.model.id ?? null;

  return (
    <PageStagger className="mx-auto flex w-full max-w-3xl flex-col gap-12 px-6 py-14">
      {/* Hero */}
      <PageStaggerItem className="flex flex-col gap-3">
        <h1 className="font-serif text-5xl font-medium tracking-tight">results</h1>
        <p className="max-w-lg text-sm leading-relaxed text-muted-foreground">
          every browser-runnable model, ranked by how well it actually answered —
          scored on real MMLU questions, in real browsers, by real GPUs.
        </p>
      </PageStaggerItem>

      {/* Ranking */}
      <PageStaggerItem className="flex flex-col gap-3">
        <div className="flex flex-col border-t border-[--border]">
          {ranked.map(({ model, agg, local }, i) => (
            <RankingRow
              key={model.id}
              rank={i + 1}
              model={model}
              aggregate={agg}
              local={local}
              index={i}
              isLeader={model.id === leaderId}
              isOpen={openIds.has(model.id)}
              onToggle={toggle}
            />
          ))}
        </div>

        {/* Frontier ceiling — published reference on the same scale */}
        {FRONTIER.length > 0 && (
          <div className="mt-6 flex flex-col">
            <div className="flex items-baseline justify-between border-b border-[--border] pb-2">
              <span className="font-mono text-[10px] uppercase tracking-widest text-[--fg-subtle]">
                frontier · published mmlu
              </span>
              <span className="font-mono text-[10px] text-[--fg-subtle]">for scale</span>
            </div>
            {FRONTIER.map((b, i) => (
              <FrontierRow
                key={b.name}
                name={b.name}
                accuracy={b.accuracy}
                source={b.source}
                index={i}
              />
            ))}
          </div>
        )}
      </PageStaggerItem>

      {/* Footer */}
      <PageStaggerItem className="flex flex-wrap items-center justify-between gap-4 border-t border-[--border] pt-6">
        <Link
          href="/methodology"
          className="font-mono text-[10px] text-[--fg-subtle] transition-colors hover:text-foreground"
        >
          how this is scored →
        </Link>
        <Link
          href="/benchmark"
          className="border border-[--border] px-5 py-2 text-sm transition-colors hover:bg-foreground/5"
        >
          run benchmark →
        </Link>
      </PageStaggerItem>
    </PageStagger>
  );
}
