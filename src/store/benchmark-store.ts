import { create } from "zustand";
import { QuestionResult } from "@/types/task";
import { BenchmarkReport } from "@/types/report";

export type BenchmarkPhase = "idle" | "loading-model" | "running" | "complete" | "error";

interface BenchmarkStore {
  phase: BenchmarkPhase;
  selectedModelId: string;
  selectedSuiteId: string;
  loadingProgress: number;
  loadingText: string;
  currentQuestionIndex: number;
  streamingText: string;
  completedResults: QuestionResult[];
  report: BenchmarkReport | null;
  error: string | null;

  setModel: (id: string) => void;
  setSuite: (id: string) => void;

  startLoading: () => void;
  setLoadingProgress: (p: number, text: string) => void;
  start: () => void;
  startQuestion: (index: number) => void;
  setStreamingText: (text: string) => void;
  advanceQuestion: (result: QuestionResult) => void;
  complete: (report: BenchmarkReport) => void;
  setError: (msg: string) => void;
  reset: () => void;
}

export const useBenchmarkStore = create<BenchmarkStore>((set) => ({
  phase: "idle",
  selectedModelId: "Qwen3-0.6B-q4f16_1-MLC",
  selectedSuiteId: "all",
  loadingProgress: 0,
  loadingText: "",
  currentQuestionIndex: 0,
  streamingText: "",
  completedResults: [],
  report: null,
  error: null,

  setModel: (id) => set({ selectedModelId: id }),
  setSuite: (id) => set({ selectedSuiteId: id }),

  startLoading: () =>
    set({ phase: "loading-model", loadingProgress: 0, loadingText: "initializing..." }),
  setLoadingProgress: (p, text) =>
    set({ loadingProgress: p, loadingText: text }),
  start: () =>
    set({ phase: "running", currentQuestionIndex: 0, completedResults: [], streamingText: "" }),
  startQuestion: (index) =>
    set({ currentQuestionIndex: index, streamingText: "" }),
  setStreamingText: (text) =>
    set({ streamingText: text }),
  advanceQuestion: (result) =>
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
      currentQuestionIndex: 0,
      streamingText: "",
      completedResults: [],
      report: null,
      error: null,
    }),
}));
