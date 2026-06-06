import { create } from "zustand";
import { QuestionResult } from "@/types/task";
import { BenchmarkReport } from "@/types/report";
import { Question, Subject, Difficulty } from "@/types/agent";

export type BenchmarkPhase = "idle" | "loading-model" | "running" | "complete" | "error";

interface BenchmarkStore {
  phase: BenchmarkPhase;
  selectedModelId: string;
  questionCount: 3 | 5 | 10;
  subjectFilter: Subject | "all";
  difficultyFilter: Difficulty | "all";
  advanceMode: "auto" | "manual";
  loadingProgress: number;
  loadingText: string;
  totalQuestions: number;
  currentQuestionIndex: number;
  currentQuestion: Question | null;
  streamingText: string;
  completedResults: QuestionResult[];
  report: BenchmarkReport | null;
  error: string | null;
  waitingForAdvance: boolean;
  advanceResolver: (() => void) | null;
  abortStreamCallback: (() => void) | null;
  aborted: boolean;

  setModel: (id: string) => void;
  setQuestionCount: (n: 3 | 5 | 10) => void;
  setSubjectFilter: (s: Subject | "all") => void;
  setDifficultyFilter: (d: Difficulty | "all") => void;
  setAdvanceMode: (m: "auto" | "manual") => void;

  startLoading: () => void;
  setLoadingProgress: (p: number, text: string) => void;
  start: (total: number) => void;
  startQuestion: (index: number, question: Question) => void;
  setStreamingText: (text: string) => void;
  advanceQuestion: (result: QuestionResult) => void;
  complete: (report: BenchmarkReport) => void;
  setError: (msg: string) => void;
  reset: () => void;

  setWaitingForAdvance: (waiting: boolean, resolver: (() => void) | null) => void;
  setAbortStreamCallback: (fn: (() => void) | null) => void;
  triggerAdvance: () => void;
  abort: () => void;
}

export const useBenchmarkStore = create<BenchmarkStore>((set, get) => ({
  phase: "idle",
  selectedModelId: "Qwen3-0.6B-q4f16_1-MLC",
  questionCount: 3,
  subjectFilter: "all",
  difficultyFilter: "all",
  advanceMode: "auto",
  loadingProgress: 0,
  loadingText: "",
  totalQuestions: 0,
  currentQuestionIndex: 0,
  currentQuestion: null,
  streamingText: "",
  completedResults: [],
  report: null,
  error: null,
  waitingForAdvance: false,
  advanceResolver: null,
  abortStreamCallback: null,
  aborted: false,

  setModel: (id) => set({ selectedModelId: id }),
  setQuestionCount: (n) => set({ questionCount: n }),
  setSubjectFilter: (s) => set({ subjectFilter: s }),
  setDifficultyFilter: (d) => set({ difficultyFilter: d }),
  setAdvanceMode: (m) => {
    if (m === "auto") {
      const { advanceResolver } = get();
      if (advanceResolver) {
        const resolve = advanceResolver;
        set({ advanceMode: m, waitingForAdvance: false, advanceResolver: null });
        setTimeout(resolve, 1000);
        return;
      }
    }
    set({ advanceMode: m });
  },

  startLoading: () =>
    set({ phase: "loading-model", loadingProgress: 0, loadingText: "initializing..." }),
  setLoadingProgress: (p, text) =>
    set({ loadingProgress: p, loadingText: text }),
  start: (total) =>
    set({ phase: "running", totalQuestions: total, currentQuestionIndex: 0, completedResults: [], streamingText: "", currentQuestion: null, aborted: false, waitingForAdvance: false, advanceResolver: null, abortStreamCallback: null }),
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

  setWaitingForAdvance: (waiting, resolver) =>
    set({ waitingForAdvance: waiting, advanceResolver: resolver }),
  setAbortStreamCallback: (fn) => set({ abortStreamCallback: fn }),
  triggerAdvance: () => {
    const { advanceResolver } = get();
    if (advanceResolver) advanceResolver();
    set({ waitingForAdvance: false, advanceResolver: null });
  },
  abort: () => {
    const { advanceResolver, abortStreamCallback } = get();
    if (abortStreamCallback) abortStreamCallback();
    if (advanceResolver) advanceResolver();
    set({ aborted: true, waitingForAdvance: false, advanceResolver: null, abortStreamCallback: null });
  },

  reset: () =>
    set({
      phase: "idle",
      subjectFilter: "all",
      difficultyFilter: "all",
      advanceMode: "auto",
      loadingProgress: 0,
      loadingText: "",
      totalQuestions: 0,
      currentQuestionIndex: 0,
      currentQuestion: null,
      streamingText: "",
      completedResults: [],
      report: null,
      error: null,
      waitingForAdvance: false,
      advanceResolver: null,
      abortStreamCallback: null,
      aborted: false,
    }),
}));
