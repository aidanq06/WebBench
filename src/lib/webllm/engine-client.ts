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

export interface StreamResult {
  text: string;
  truncated: boolean;            // hit the token cap (finish_reason "length")
  stoppedForRepetition: boolean; // generation was cut off because it was looping
}

// A model is looping when the same ~48-char tail recurs verbatim several times —
// a strong signal it has stopped making progress and is repeating itself.
function looksRepetitive(text: string): boolean {
  if (text.length < 280) return false;
  const tail = text.slice(-48);
  if (tail.trim().length < 12) return false;
  let count = 0;
  let idx = 0;
  while ((idx = text.indexOf(tail, idx)) !== -1) {
    count++;
    idx += tail.length;
  }
  return count >= 3;
}

export async function generateStream(
  messages: { role: string; content: string }[],
  options: { temperature?: number; max_tokens?: number; signal?: AbortSignal },
  onChunk: (fullText: string) => void
): Promise<StreamResult> {
  if (!engine) throw new Error("engine not loaded");
  const activeEngine = engine;
  const stream = await activeEngine.chat.completions.create({
    messages: messages as Parameters<typeof activeEngine.chat.completions.create>[0]["messages"],
    temperature: options.temperature ?? 0.1,
    max_tokens: options.max_tokens ?? 400,
    stream: true,
  });

  let fullText = "";
  let interruptRequested = false;
  let stoppedForRepetition = false;
  let finishReason: string | null = null;

  // Cleanly end generation at the engine level. Unlike breaking out of the loop,
  // interruptGenerate() lets the worker finish gracefully, so the next question's
  // generate call doesn't hang.
  const requestInterrupt = () => {
    if (interruptRequested) return;
    interruptRequested = true;
    activeEngine.interruptGenerate();
  };

  for await (const chunk of stream) {
    if (options.signal?.aborted) break;
    if (chunk.choices[0]?.finish_reason) finishReason = chunk.choices[0].finish_reason;
    const delta = chunk.choices[0]?.delta?.content ?? "";
    if (delta) {
      fullText += delta;
      onChunk(fullText);
      if (!interruptRequested && looksRepetitive(fullText)) {
        stoppedForRepetition = true;
        requestInterrupt();
      }
    }
  }

  return { text: fullText, truncated: finishReason === "length", stoppedForRepetition };
}

export function unloadModel(): void {
  if (currentWorker) {
    currentWorker.terminate();
    currentWorker = null;
  }
  engine = null;
}
