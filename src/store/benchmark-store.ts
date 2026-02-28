import { create } from "zustand";
import { QuestionResult } from "@/types/task";
import { BenchmarkReport } from "@/types/report";
import { Question } from "@/types/agent";

export type BenchmarkPhase = "idle" | "loading-model" | "running" | "complete" | "error";

interface BenchmarkStore {
  phase: BenchmarkPhase;
  selectedModelId: string;
  questionCount: 10 | 20 | 40;
  loadingProgress: number;
  loadingText: string;
  totalQuestions: number;
  currentQuestionIndex: number;
  currentQuestion: Question | null;
  streamingText: string;
  completedResults: QuestionResult[];
  report: BenchmarkReport | null;
  error: string | null;

  setModel: (id: string) => void;
  setQuestionCount: (n: 10 | 20 | 40) => void;

  startLoading: () => void;
  setLoadingProgress: (p: number, text: string) => void;
  start: (total: number) => void;
  startQuestion: (index: number, question: Question) => void;
  setStreamingText: (text: string) => void;
  advanceQuestion: (result: QuestionResult) => void;
  complete: (report: BenchmarkReport) => void;
  setError: (msg: string) => void;
  reset: () => void;
}

export const useBenchmarkStore = create<BenchmarkStore>((set) => ({
  phase: "idle",
  selectedModelId: "Qwen3-0.6B-q4f16_1-MLC",
  questionCount: 20,
  loadingProgress: 0,
  loadingText: "",
  totalQuestions: 0,
  currentQuestionIndex: 0,
  currentQuestion: null,
  streamingText: "",
  completedResults: [],
  report: null,
  error: null,

  setModel: (id) => set({ selectedModelId: id }),
  setQuestionCount: (n) => set({ questionCount: n }),

  startLoading: () =>
    set({ phase: "loading-model", loadingProgress: 0, loadingText: "initializing..." }),
  setLoadingProgress: (p, text) =>
    set({ loadingProgress: p, loadingText: text }),
  start: (total) =>
    set({ phase: "running", totalQuestions: total, currentQuestionIndex: 0, completedResults: [], streamingText: "", currentQuestion: null }),
  startQuestion: (index, question) =>
    set({ currentQuestionIndex: index, currentQuestion: question, streamingText: "" }),
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
      totalQuestions: 0,
      currentQuestionIndex: 0,
      currentQuestion: null,
      streamingText: "",
      completedResults: [],
      report: null,
      error: null,
    }),
}));
