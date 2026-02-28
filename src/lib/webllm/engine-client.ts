import {
  CreateWebWorkerMLCEngine,
  type MLCEngineInterface,
  type InitProgressCallback,
} from "@mlc-ai/web-llm";

let engine: MLCEngineInterface | null = null;
let currentWorker: Worker | null = null;

export async function loadModel(
  modelId: string,
  onProgress: InitProgressCallback
): Promise<void> {
  // clean up previous worker if any
  if (currentWorker) {
    currentWorker.terminate();
    currentWorker = null;
    engine = null;
  }

  const worker = new Worker(new URL("./worker.ts", import.meta.url), {
    type: "module",
  });
  currentWorker = worker;

  try {
    engine = await CreateWebWorkerMLCEngine(worker, modelId, {
      initProgressCallback: onProgress,
    });
  } catch (err) {
    worker.terminate();
    currentWorker = null;
    engine = null;
    if (err instanceof Error) throw err;
    throw new Error(String(err));
  }
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

export async function generateStream(
  messages: { role: string; content: string }[],
  options: { temperature?: number; max_tokens?: number },
  onChunk: (fullText: string) => void
): Promise<string> {
  if (!engine) throw new Error("engine not loaded");
  const stream = await engine.chat.completions.create({
    messages: messages as Parameters<typeof engine.chat.completions.create>[0]["messages"],
    temperature: options.temperature ?? 0.1,
    max_tokens: options.max_tokens ?? 1024,
    stream: true,
  });

  let fullText = "";
  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content ?? "";
    if (delta) {
      fullText += delta;
      onChunk(fullText);
    }
  }
  return fullText;
}

export function unloadModel(): void {
  if (currentWorker) {
    currentWorker.terminate();
    currentWorker = null;
  }
  engine = null;
}
