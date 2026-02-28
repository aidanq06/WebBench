import { create } from "zustand";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export type ChatPhase = "idle" | "loading-model" | "ready" | "generating" | "error";

interface ChatStore {
  phase: ChatPhase;
  selectedModelId: string;
  loadingProgress: number;
  loadingText: string;
  messages: ChatMessage[];
  streamingText: string;
  error: string | null;

  setModel: (id: string) => void;
  startLoading: () => void;
  setLoadingProgress: (p: number, text: string) => void;
  setReady: () => void;
  addUserMessage: (text: string) => void;
  startGenerating: () => void;
  setStreamingText: (text: string) => void;
  completeAssistantMessage: (text: string) => void;
  setError: (msg: string) => void;
  clearChat: () => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  phase: "idle",
  selectedModelId: "Qwen3-0.6B-q4f16_1-MLC",
  loadingProgress: 0,
  loadingText: "",
  messages: [],
  streamingText: "",
  error: null,

  setModel: (id) => set({ selectedModelId: id }),
  startLoading: () =>
    set({ phase: "loading-model", loadingProgress: 0, loadingText: "initializing..." }),
  setLoadingProgress: (p, text) =>
    set({ loadingProgress: p, loadingText: text }),
  setReady: () =>
    set({ phase: "ready", loadingProgress: 1, loadingText: "" }),
  addUserMessage: (text) =>
    set((s) => ({ messages: [...s.messages, { role: "user" as const, content: text }] })),
  startGenerating: () =>
    set({ phase: "generating", streamingText: "" }),
  setStreamingText: (text) =>
    set({ streamingText: text }),
  completeAssistantMessage: (text) =>
    set((s) => ({
      phase: "ready",
      streamingText: "",
      messages: [...s.messages, { role: "assistant" as const, content: text }],
    })),
  setError: (msg) =>
    set({ phase: "error", error: msg }),
  clearChat: () =>
    set({ messages: [], streamingText: "", phase: "ready" }),
}));
