"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useChatStore, ChatMessage } from "@/store/chat-store";
import { loadModel } from "@/lib/webllm/engine-client";
import { generateStream } from "@/lib/webllm/engine-client";
import { AVAILABLE_MODELS } from "@/lib/webllm/models";
import { Navbar } from "@/components/landing/Navbar";

const SYSTEM_PROMPT = "You are a helpful assistant. Be concise and clear.";

// ── Model selector (idle state) ──────────────────────────────────────────────
function ModelSelector({
  onSelect,
}: {
  onSelect: (modelId: string) => void;
}) {
  const { selectedModelId, setModel } = useChatStore();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-medium tracking-tighter">chat</h1>
        <p className="text-sm text-muted-foreground">
          select a model to start chatting. runs locally in your browser via webgpu.
        </p>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {AVAILABLE_MODELS.map((model) => (
          <button
            key={model.id}
            onClick={() => {
              setModel(model.id);
              onSelect(model.id);
            }}
            className={`flex flex-col gap-1 border px-3 py-2.5 text-left text-sm transition-colors hover:bg-accent/50 ${
              selectedModelId === model.id
                ? "border-foreground/30 bg-accent"
                : ""
            }`}
          >
            <span className="font-medium">{model.displayName}</span>
            <span className="text-[10px] text-muted-foreground">
              {model.parameterCount} · ~{model.estimatedSizeMB >= 1000 ? `${(model.estimatedSizeMB / 1000).toFixed(1)}gb` : `${model.estimatedSizeMB}mb`}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Message bubble ───────────────────────────────────────────────────────────
function MessageBubble({
  message,
  isStreaming,
}: {
  message: ChatMessage;
  isStreaming?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="flex flex-col gap-1"
    >
      <span className="text-[10px] text-muted-foreground/50">
        {message.role}
      </span>
      <div
        className={`text-sm leading-relaxed ${
          message.role === "user"
            ? "border bg-accent/50 px-4 py-3"
            : "border-l-2 border-muted-foreground/20 pl-4 py-1"
        }`}
      >
        <pre className="whitespace-pre-wrap font-[inherit]">
          {message.content}
          {isStreaming && (
            <span className="animate-pulse text-muted-foreground">▋</span>
          )}
        </pre>
      </div>
    </motion.div>
  );
}

// ── Chat input ───────────────────────────────────────────────────────────────
function ChatInput({
  onSend,
  disabled,
}: {
  onSend: (text: string) => void;
  disabled: boolean;
}) {
  const [input, setInput] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || disabled) return;
    setInput("");
    onSend(text);
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={disabled ? "waiting for response..." : "type a message..."}
        disabled={disabled}
        className="flex-1 border bg-transparent px-4 py-3 text-sm outline-none placeholder:text-muted-foreground/40 focus:border-foreground/30 disabled:opacity-50"
      />
      <button
        type="submit"
        disabled={disabled || !input.trim()}
        className="border bg-primary px-6 py-3 text-sm text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-30"
      >
        send
      </button>
    </form>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function ChatPage() {
  const {
    phase,
    selectedModelId,
    loadingProgress,
    loadingText,
    messages,
    streamingText,
    error,
  } = useChatStore();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const selectedModel = AVAILABLE_MODELS.find((m) => m.id === selectedModelId);

  // auto-scroll on new messages / streaming
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText]);

  const handleSelectModel = useCallback(async (modelId: string) => {
    const store = useChatStore.getState();
    try {
      store.startLoading();
      await loadModel(modelId, (report) => {
        useChatStore.getState().setLoadingProgress(report.progress, report.text);
      });
      useChatStore.getState().setReady();
    } catch (err) {
      useChatStore
        .getState()
        .setError(err instanceof Error ? err.message : String(err));
    }
  }, []);

  const handleSend = useCallback(
    async (text: string) => {
      const store = useChatStore.getState();
      store.addUserMessage(text);
      store.startGenerating();

      const allMessages = [
        { role: "system", content: SYSTEM_PROMPT },
        ...store.messages,
        { role: "user", content: text },
      ];

      try {
        const fullText = await generateStream(
          allMessages,
          { temperature: 0.7, max_tokens: 1024 },
          (partial) => {
            useChatStore.getState().setStreamingText(partial);
          }
        );
        useChatStore.getState().completeAssistantMessage(fullText);
      } catch (err) {
        useChatStore
          .getState()
          .setError(err instanceof Error ? err.message : String(err));
      }
    },
    []
  );

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <div className="flex flex-1 flex-col items-center px-6">
        <div className="flex w-full max-w-2xl flex-1 flex-col py-8">

          {/* ── idle: model selector ── */}
          {phase === "idle" && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="flex flex-1 items-center"
            >
              <ModelSelector onSelect={handleSelectModel} />
            </motion.div>
          )}

          {/* ── loading model ── */}
          {phase === "loading-model" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-1 flex-col items-center justify-center gap-6"
            >
              <div className="w-full max-w-sm flex flex-col gap-4">
                <div className="text-sm">
                  loading{" "}
                  <span className="text-muted-foreground">
                    {selectedModel?.displayName ?? selectedModelId}
                  </span>
                  ...
                </div>
                <div className="relative h-0.5 w-full bg-secondary">
                  <motion.div
                    className="absolute inset-y-0 left-0 bg-foreground"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.round(loadingProgress * 100)}%` }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{loadingText}</span>
                  <span className="text-xs text-muted-foreground">
                    {Math.round(loadingProgress * 100)}%
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── ready / generating: chat interface ── */}
          {(phase === "ready" || phase === "generating") && (
            <div className="flex flex-1 flex-col">
              {/* top bar: model info + clear */}
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">
                    {selectedModel?.displayName ?? selectedModelId}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {selectedModel?.parameterCount}
                  </span>
                </div>
                <button
                  onClick={() => useChatStore.getState().clearChat()}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  clear chat
                </button>
              </div>

              {/* messages */}
              <div className="flex-1 overflow-y-auto py-6">
                {messages.length === 0 && phase === "ready" && (
                  <div className="flex flex-1 items-center justify-center py-20">
                    <p className="text-sm text-muted-foreground/40">
                      start a conversation
                    </p>
                  </div>
                )}
                <div className="flex flex-col gap-5">
                  <AnimatePresence initial={false}>
                    {messages.map((msg, i) => (
                      <MessageBubble key={i} message={msg} />
                    ))}
                  </AnimatePresence>
                  {/* streaming message */}
                  {phase === "generating" && streamingText && (
                    <MessageBubble
                      message={{ role: "assistant", content: streamingText }}
                      isStreaming
                    />
                  )}
                  {phase === "generating" && !streamingText && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center gap-2 text-xs text-muted-foreground/50"
                    >
                      <span className="animate-pulse">thinking...</span>
                    </motion.div>
                  )}
                </div>
                <div ref={messagesEndRef} />
              </div>

              {/* input */}
              <div className="border-t pt-4 pb-2">
                <ChatInput
                  onSend={handleSend}
                  disabled={phase === "generating"}
                />
              </div>
            </div>
          )}

          {/* ── error ── */}
          {phase === "error" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-1 items-center justify-center"
            >
              <div className="flex flex-col gap-3 border border-destructive p-5">
                <div className="text-xs text-muted-foreground">error</div>
                <div className="text-sm text-destructive">{error}</div>
                <button
                  className="self-start border px-3 py-1.5 text-sm hover:bg-accent/50"
                  onClick={() => {
                    useChatStore.getState().setError("");
                    useChatStore.setState({ phase: "idle" });
                  }}
                >
                  try again
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
