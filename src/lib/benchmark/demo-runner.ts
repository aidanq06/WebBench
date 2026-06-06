import { QUESTIONS } from "./questions";
import { generateReport } from "./scorer";
import { useBenchmarkStore } from "@/store/benchmark-store";
import { QuestionResult } from "@/types/task";
import { HardwareInfo } from "@/types/report";
import { extractAnswer } from "./answer-extractor";

const CHAR_DELAY_MS = 5;

const LOADING_STEPS = [
  { progress: 0.15, text: "initializing webgpu context...", delay: 400 },
  { progress: 0.45, text: "loading tokenizer...", delay: 600 },
  { progress: 0.78, text: "loading model weights...", delay: 900 },
  { progress: 1.0, text: "model ready", delay: 600 },
];

const DEMO_HARDWARE: HardwareInfo = {
  gpuVendor: "apple",
  gpuDevice: "Apple M3 Pro",
  deviceClass: "apple-silicon",
  cpuThreads: 12,
  browser: "chrome",
  os: "macos",
  webgpuBackend: "metal",
  maxBufferBytes: 10737418240,
};

interface DemoScript {
  questionId: string;
  response: string;
  correct: boolean;
}

// A short, subject-varied demo (3 hits + 2 misses ≈ 60%, realistic for ~3B).
const DEMO_SCRIPTS: DemoScript[] = [
  {
    questionId: "computer-science-14",
    correct: true,
    response:
      "TCP is a transport-layer protocol operating above IP in the network stack.\n\n" +
      "IP handles routing packets through the network; TCP builds on top of IP to add reliability guarantees.\n\n" +
      "TCP's core responsibility is reliable, ordered delivery of multi-packet messages between machines not necessarily directly connected.\n\n" +
      "ANSWER: C",
  },
  {
    questionId: "electrical-engineering-03",
    correct: true,
    response:
      "Universal logic gates can implement any Boolean function using only that single gate type.\n\n" +
      "NAND and NOR are the two canonical universal gates — every Boolean function can be built from NAND alone, or from NOR alone.\n\n" +
      "XOR is not universal by itself; OR, NOT, and AND together form a functionally complete set, but individually they are not.\n\n" +
      "ANSWER: A",
  },
  {
    questionId: "abstract-algebra-01",
    correct: true,
    response:
      "Note that √18 = 3√2, which is already in Q(√2). So Q(√2, √3, √18) = Q(√2, √3).\n\n" +
      "[Q(√2) : Q] = 2 because x² − 2 is irreducible over Q by Eisenstein's criterion.\n\n" +
      "[Q(√2, √3) : Q(√2)] = 2 because √3 ∉ Q(√2). By the tower law, total degree = 2 × 2 = 4.\n\n" +
      "ANSWER: B",
  },
  {
    questionId: "computer-science-37",
    correct: false,
    response:
      "Insertion sort is O(n) on nearly-sorted input but degrades to O(n²) on reverse-sorted — it is highly input-dependent.\n\n" +
      "Quicksort also varies dramatically: near O(n log n) on average but O(n²) on sorted or reverse-sorted inputs.\n\n" +
      "Selection sort always makes exactly n(n−1)/2 comparisons regardless of the input ordering — its runtime never varies.\n\n" +
      "ANSWER: D",
  },
  {
    questionId: "physics-01",
    correct: false,
    response:
      "With quantum efficiency 0.1 and 100 photons sent, the expected detection count is np = 100 × 0.1 = 10.\n\n" +
      "For the uncertainty, applying the Poisson approximation gives standard deviation ≈ √(mean) = √10 ≈ 3.16.\n\n" +
      "3.16 rounds up toward 4 rather than 3 when considering detection uncertainty, so the rms deviation is about 4.\n\n" +
      "ANSWER: A",
  },
];

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export async function runDemoBenchmark(modelId: string, runId: string): Promise<void> {
  const store = useBenchmarkStore.getState();

  store.startLoading();
  for (const step of LOADING_STEPS) {
    await sleep(step.delay);
    useBenchmarkStore.getState().setLoadingProgress(step.progress, step.text);
  }

  store.start(DEMO_SCRIPTS.length);

  const results: QuestionResult[] = [];
  const runStart = Date.now();
  let totalCharsGenerated = 0;

  for (let i = 0; i < DEMO_SCRIPTS.length; i++) {
    const script = DEMO_SCRIPTS[i];
    const question = QUESTIONS.find((q) => q.id === script.questionId)!;
    useBenchmarkStore.getState().startQuestion(i, question);

    const qStart = Date.now();
    let accumulated = "";
    for (const char of script.response) {
      if (useBenchmarkStore.getState().aborted) break;
      accumulated += char;
      useBenchmarkStore.getState().setStreamingText(accumulated);
      await sleep(CHAR_DELAY_MS);
    }

    if (useBenchmarkStore.getState().aborted) break;

    const { letter, source } = extractAnswer(script.response, question.choices);

    const result: QuestionResult = {
      questionId: question.id,
      subject: question.subject,
      difficulty: question.difficulty,
      correct: script.correct,
      modelResponse: script.response,
      extractedAnswer: letter,
      extractionSource: source,
      expectedAnswer: question.expectedAnswer,
      timeTakenMs: Date.now() - qStart,
    };

    totalCharsGenerated += script.response.length;
    results.push(result);
    useBenchmarkStore.getState().advanceQuestion(result);

    // Hand pacing to BenchmarkProgress, exactly like the real runner — it
    // resolves this after the answer reveal (auto) or on click (manual).
    await new Promise<void>((resolve) => {
      useBenchmarkStore.getState().setWaitingForAdvance(true, resolve);
    });

    if (useBenchmarkStore.getState().aborted) break;
  }

  const totalMs = Date.now() - runStart;
  const tokensPerSecond = parseFloat(
    ((totalCharsGenerated / 4) / (totalMs / 1000)).toFixed(1)
  );
  const report = generateReport(results, modelId, String(DEMO_SCRIPTS.length), runId, tokensPerSecond, DEMO_HARDWARE);
  sessionStorage.setItem(`report-${runId}`, JSON.stringify(report));

  useBenchmarkStore.getState().complete(report);
}
