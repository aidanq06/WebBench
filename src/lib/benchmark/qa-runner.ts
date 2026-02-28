import { getRandomQuestions } from "./questions";
import { generateReport } from "./scorer";
import { generateStream } from "@/lib/webllm/engine-client";
import { useBenchmarkStore } from "@/store/benchmark-store";
import { QuestionResult } from "@/types/task";
import { Question } from "@/types/agent";

const SYSTEM_PROMPT = `You are a knowledge benchmark assistant. For each question:
1. Show your reasoning step by step
2. End your response with exactly: ANSWER: <your answer>

Be concise. The answer after "ANSWER:" should be just the value — no extra words.`;

function extractAnswer(text: string): string {
  const match = text.match(/ANSWER:\s*(.+?)(?:\n|$)/im);
  return match ? match[1].trim() : "";
}

function checkAnswer(extracted: string, expected: string, matchType: Question["matchType"]): boolean {
  const a = extracted.toLowerCase().trim();
  const e = expected.toLowerCase().trim();
  if (matchType === "exact") return a === e;
  return a.includes(e) || e.includes(a);
}

export async function runQABenchmark(
  modelId: string,
  questionCount: 20 | 40,
  runId: string
): Promise<void> {
  const store = useBenchmarkStore.getState();
  const questions = getRandomQuestions(questionCount);
  const results: QuestionResult[] = [];

  store.start(questions.length);

  for (let i = 0; i < questions.length; i++) {
    const question = questions[i];
    store.startQuestion(i, question);

    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: question.text },
    ];

    const startTime = Date.now();
    let modelResponse = "";

    try {
      modelResponse = await generateStream(
        messages,
        { temperature: 0.1, max_tokens: 512 },
        (fullText) => {
          useBenchmarkStore.getState().setStreamingText(fullText);
        }
      );
    } catch {
      modelResponse = "";
    }

    const timeTakenMs = Date.now() - startTime;
    const extractedAnswer = extractAnswer(modelResponse);
    const correct = checkAnswer(extractedAnswer, question.expectedAnswer, question.matchType);

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

  const report = generateReport(results, modelId, String(questionCount), runId);
  sessionStorage.setItem(`report-${runId}`, JSON.stringify(report));
  store.complete(report);
}
