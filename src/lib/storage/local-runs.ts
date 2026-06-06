import type { BenchmarkReport } from "@/types/report";

const KEY = "webbench:runs";
const MAX_RUNS = 20;

export function toPersistable(report: BenchmarkReport): BenchmarkReport {
  return report;
}

export function saveLocalRun(report: BenchmarkReport): void {
  if (typeof localStorage === "undefined") return;
  const runs = getLocalRuns();
  runs.unshift(toPersistable(report));
  try {
    localStorage.setItem(KEY, JSON.stringify(runs.slice(0, MAX_RUNS)));
  } catch {
    localStorage.setItem(KEY, JSON.stringify(runs.slice(0, 5)));
  }
}

export function getLocalRuns(): BenchmarkReport[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as BenchmarkReport[]) : [];
  } catch {
    return [];
  }
}
