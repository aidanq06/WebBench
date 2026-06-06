import { getRandomQuestions } from "./questions";
import { generateReport } from "./scorer";
import { generateStream } from "@/lib/webllm/engine-client";
import { getFewShotMessages } from "./few-shot-examples";
import { saveLocalRun, toPersistable } from "@/lib/storage/local-runs";
import { useBenchmarkStore } from "@/store/benchmark-store";
import { QuestionResult } from "@/types/task";
import { detectHardware } from "@/lib/hardware/detect";
import { extractAnswer } from "./answer-extractor";

// One call per question. The model writes whatever it wants; afterwards we run
// a layered extractor over the raw text to recover the chosen letter. Nothing
// constrains the generation — the user sees exactly what the model produced,
// including spirals, hedges, and template parroting. That's the point.
const SYSTEM_PROMPT = `You are taking a multiple-choice exam. Each question has four options labeled A, B, C, and D. Exactly one is correct. Reason briefly, then end your response with a line in the form \`ANSWER: X\` where X is the chosen letter.`;

export async function runQABenchmark(
  modelId: string,
  questionCount: 3 | 5 | 10,
  runId: string
): Promise<void> {
  const store = useBenchmarkStore.getState();
  const questions = getRandomQuestions(questionCount, store.subjectFilter, store.difficultyFilter);
  const results: QuestionResult[] = [];

  const hardware = await detectHardware();

  store.start(questions.length);

  let totalCharsGenerated = 0;
  let totalInferenceMs = 0;

  for (let i = 0; i < questions.length; i++) {
    const question = questions[i];
    useBenchmarkStore.getState().startQuestion(i, question);

    const choicesText = question.choices
      .map((c, idx) => `${["A", "B", "C", "D"][idx]}. ${c}`)
      .join("\n");
    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...getFewShotMessages(question.subject),
      { role: "user", content: `${question.text}\n\n${choicesText}` },
    ];

    const startTime = Date.now();
    let streamText = "";

    const controller = new AbortController();
    useBenchmarkStore.getState().setAbortStreamCallback(() => controller.abort());

    try {
      const sr = await generateStream(
        messages,
        {
          temperature: 0.1,
          max_tokens: 400,
          signal: controller.signal,
        },
        (fullText) => {
          useBenchmarkStore.getState().setStreamingText(fullText);
        }
      );
      streamText = sr.text;
    } catch {
      // aborted or engine error — proceed with whatever text we have.
    } finally {
      useBenchmarkStore.getState().setAbortStreamCallback(null);
    }

    if (useBenchmarkStore.getState().aborted) break;

    const { letter, source } = extractAnswer(streamText, question.choices);
    const timeTakenMs = Date.now() - startTime;
    totalCharsGenerated += streamText.length;
    totalInferenceMs += timeTakenMs;

    const result: QuestionResult = {
      questionId: question.id,
      subject: question.subject,
      difficulty: question.difficulty,
      correct: letter !== "" && letter === question.expectedAnswer,
      modelResponse: streamText,
      extractedAnswer: letter,
      extractionSource: source,
      expectedAnswer: question.expectedAnswer,
      timeTakenMs,
    };

    results.push(result);
    useBenchmarkStore.getState().advanceQuestion(result);

    await new Promise<void>((resolve) => {
      useBenchmarkStore.getState().setWaitingForAdvance(true, resolve);
    });

    if (useBenchmarkStore.getState().aborted) break;
  }

  const tokensPerSecond =
    totalInferenceMs > 0
      ? parseFloat(((totalCharsGenerated / 4) / (totalInferenceMs / 1000)).toFixed(1))
      : 0;

  const report = generateReport(results, modelId, String(questionCount), runId, tokensPerSecond, hardware);
  const persistable = toPersistable(report);
  sessionStorage.setItem(`report-${runId}`, JSON.stringify(persistable));
  saveLocalRun(persistable);

  useBenchmarkStore.getState().complete(report);

  // Fire-and-forget share to community. Errors swallowed — a DB outage must
  // never block the user's local report or interrupt their flow.
  void fetch("/api/runs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(persistable),
  }).catch(() => {});
}
