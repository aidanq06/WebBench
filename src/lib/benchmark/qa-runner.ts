import { getRandomQuestions } from "./questions";
import { generateReport } from "./scorer";
import { generateStream } from "@/lib/webllm/engine-client";
import { useBenchmarkStore } from "@/store/benchmark-store";
import { QuestionResult } from "@/types/task";
import { createClient } from "@/lib/supabase/client";
import { detectHardware } from "@/lib/hardware/detect";

const SYSTEM_PROMPT = `You are a multiple-choice benchmark assistant. For each question:
1. Think through the options carefully
2. End your response with exactly: ANSWER: X

Where X is the single letter (A, B, C, or D) of the correct option.
The ANSWER line must contain only the letter — nothing else.`;

function extractAnswer(text: string): string {
  const match = text.match(/ANSWER:\s*([ABCD])/i);
  return match ? match[1].toUpperCase() : "";
}

function checkAnswer(extracted: string, expected: string): boolean {
  return extracted === expected;
}

export async function runQABenchmark(
  modelId: string,
  questionCount: 10 | 20 | 40,
  runId: string
): Promise<void> {
  const store = useBenchmarkStore.getState();
  const questions = getRandomQuestions(questionCount, store.subjectFilter, store.difficultyFilter);
  const results: QuestionResult[] = [];

  // Detect hardware once before the run starts
  const hardware = await detectHardware();

  store.start(questions.length);

  let totalCharsGenerated = 0;
  let totalInferenceMs = 0;

  for (let i = 0; i < questions.length; i++) {
    const question = questions[i];
    store.startQuestion(i, question);

    const choicesText = question.choices
      .map((c, i) => `${["A", "B", "C", "D"][i]}. ${c}`)
      .join("\n");
    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: `${question.text}\n\n${choicesText}` },
    ];

    const startTime = Date.now();
    let modelResponse = "";

    try {
      modelResponse = await generateStream(
        messages,
        { temperature: 0.1, max_tokens: 1024, stopOnAnswerLine: true },
        (fullText) => {
          useBenchmarkStore.getState().setStreamingText(fullText);
        }
      );
    } catch {
      modelResponse = "";
    }

    const timeTakenMs = Date.now() - startTime;
    totalCharsGenerated += modelResponse.length;
    totalInferenceMs += timeTakenMs;

    const extractedAnswer = extractAnswer(modelResponse);
    const correct = checkAnswer(extractedAnswer, question.expectedAnswer);

    const result: QuestionResult = {
      questionId: question.id,
      subject: question.subject,
      difficulty: question.difficulty,
      correct,
      modelResponse,
      extractedAnswer,
      expectedAnswer: question.expectedAnswer,
      timeTakenMs,
    };

    results.push(result);
    store.advanceQuestion(result);

    // brief pause to let result flash render
    await new Promise((r) => setTimeout(r, 1200));
  }

  // ~4 chars per token is a reasonable approximation for English text
  const tokensPerSecond =
    totalInferenceMs > 0
      ? parseFloat(((totalCharsGenerated / 4) / (totalInferenceMs / 1000)).toFixed(1))
      : 0;

  const report = generateReport(results, modelId, String(questionCount), runId, tokensPerSecond, hardware);
  sessionStorage.setItem(`report-${runId}`, JSON.stringify(report));

  // Save to DB if signed in (fire-and-forget — local report already saved)
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(report),
      });
    }
  } catch {
    // DB save failed — local sessionStorage copy still available
  }

  store.complete(report);
}
