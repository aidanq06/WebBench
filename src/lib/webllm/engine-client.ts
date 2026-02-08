import {
  CreateWebWorkerMLCEngine,
  type MLCEngineInterface,
  type InitProgressCallback,
} from "@mlc-ai/web-llm";

let engine: MLCEngineInterface | null = null;

export async function loadModel(
  modelId: string,
  onProgress: InitProgressCallback
): Promise<void> {
  const worker = new Worker(new URL("./worker.ts", import.meta.url), {
    type: "module",
  });
  engine = await CreateWebWorkerMLCEngine(worker, modelId, {
    initProgressCallback: onProgress,
  });
}

export async function generateCompletion(
  messages: { role: string; content: string }[],
  options: { temperature?: number; max_tokens?: number } = {}
): Promise<string> {
  if (!engine) throw new Error("engine not loaded");
  const response = await engine.chat.completions.create({
    messages: messages as Parameters<typeof engine.chat.completions.create>[0]["messages"],
    temperature: options.temperature ?? 0.1,
    max_tokens: options.max_tokens ?? 256,
    stream: false,
  });
  return response.choices[0].message.content ?? "";
}

export function unloadModel(): void {
  engine = null;
}
