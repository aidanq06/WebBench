import { create } from "zustand";
import { StepLog } from "@/types/agent";
import { TaskResult } from "@/types/task";
import { BenchmarkReport } from "@/types/report";

export type BenchmarkPhase = "idle" | "loading-model" | "running" | "complete" | "error";

interface BenchmarkConfig {
  maxSteps: number;
  maxTimeMs: number;
}

interface BenchmarkStore {
  phase: BenchmarkPhase;
  selectedModelId: string;
  selectedSuiteId: string;
  config: BenchmarkConfig;
  loadingProgress: number;
  loadingText: string;
  currentTaskIndex: number;
  currentStepLogs: StepLog[];
  completedResults: TaskResult[];
  report: BenchmarkReport | null;
  error: string | null;

  setModel: (id: string) => void;
  setSuite: (id: string) => void;
  setConfig: (config: Partial<BenchmarkConfig>) => void;
  startLoading: () => void;
  setLoadingProgress: (p: number, text: string) => void;
  startRunning: () => void;
  startTask: (index: number) => void;
  addStep: (log: StepLog) => void;
  advanceTask: (result: TaskResult) => void;
  complete: (report: BenchmarkReport) => void;
  setError: (msg: string) => void;
  reset: () => void;
}

export const useBenchmarkStore = create<BenchmarkStore>((set) => ({
  phase: "idle",
  selectedModelId: "Qwen2.5-0.5B-Instruct-q4f16_1-MLC",
  selectedSuiteId: "standard",
  config: { maxSteps: 15, maxTimeMs: 60000 },
  loadingProgress: 0,
  loadingText: "",
  currentTaskIndex: 0,
  currentStepLogs: [],
  completedResults: [],
  report: null,
  error: null,

  setModel: (id) => set({ selectedModelId: id }),
  setSuite: (id) => set({ selectedSuiteId: id }),
  setConfig: (config) =>
    set((s) => ({ config: { ...s.config, ...config } })),
  startLoading: () =>
    set({ phase: "loading-model", loadingProgress: 0, loadingText: "initializing..." }),
  setLoadingProgress: (p, text) =>
    set({ loadingProgress: p, loadingText: text }),
  startRunning: () =>
    set({ phase: "running", currentTaskIndex: 0, completedResults: [], currentStepLogs: [] }),
  startTask: (index) =>
    set({ currentTaskIndex: index, currentStepLogs: [] }),
  addStep: (log) =>
    set((s) => ({ currentStepLogs: [...s.currentStepLogs, log] })),
  advanceTask: (result) =>
    set((s) => ({ completedResults: [...s.completedResults, result] })),
  complete: (report) =>
    set({ phase: "complete", report }),
  setError: (msg) =>
    set({ phase: "error", error: msg }),
  reset: () =>
    set({
      phase: "idle",
      loadingProgress: 0,
      loadingText: "",
      currentTaskIndex: 0,
      currentStepLogs: [],
      completedResults: [],
      report: null,
      error: null,
    }),
}));
