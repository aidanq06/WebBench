import { getRandomQuestions } from "./questions";
import { generateReport } from "./scorer";
import { generateStream } from "@/lib/webllm/engine-client";
import { useBenchmarkStore } from "@/store/benchmark-store";
import { QuestionResult } from "@/types/task";
import { Question } from "@/types/agent";

const SYSTEM_PROMPT = `You are a knowledge benchmark assistant. For each question:
1. Show your reasoning step by step
2. End your response with exactly: ANSWER: <your answer>

CRITICAL rules for the ANSWER line:
- Plain text only — no LaTeX, no markdown, no asterisks, no dollar signs
- Write fractions as a/b (e.g. write 3/2 not $\\frac{3}{2}$)
- Write the bare value only — no units unless the question asks for them, no extra words`;

function extractAnswer(text: string): string {
  // Grab everything after the last ANSWER: on its own token boundary
  const match = text.match(/ANSWER:\s*(.+?)(?:\n|$)/im);
  return match ? match[1].trim() : "";
}

// Strip LaTeX, markdown formatting, and stray punctuation so answers can be compared fairly.
function normalizeAnswer(raw: string): string {
  let s = raw;
  // LaTeX fractions: \frac{a}{b} → a/b
  s = s.replace(/\\frac\{([^}]*)\}\{([^}]*)\}/g, "$1/$2");
  // Remaining LaTeX commands (\cdot, \times, \approx, etc.)
  s = s.replace(/\\[a-zA-Z]+\*?/g, "");
  // LaTeX delimiters $...$ or $$...$$
  s = s.replace(/\$+([^$]*)\$+/g, "$1").replace(/\$+/g, "");
  // Markdown bold/italic (**text**, *text*, __text__, _text_)
  s = s.replace(/\*{1,3}([^*]*)\*{1,3}/g, "$1");
  s = s.replace(/_{1,2}([^_]*)_{1,2}/g, "$1");
  // Stray asterisks or backticks
  s = s.replace(/[*`]/g, "");
  // Array brackets: [6, 8] → 6, 8
  s = s.replace(/^\[(.+)\]$/, "$1");
  // Trailing/leading punctuation
  s = s.replace(/[.,;:!?\s]+$/, "").replace(/^[.,;:!?\s]+/, "");
  return s.trim().toLowerCase();
}

// Try to parse a normalized string as a number (handles decimals, fractions, mixed numbers).
function parseNumeric(s: string): number | null {
  // Plain decimal / integer
  const direct = parseFloat(s);
  if (!isNaN(direct) && String(direct).length > 0) return direct;
  // Fraction  a/b
  const frac = s.match(/^(-?\d+)\s*\/\s*(-?\d+)$/);
  if (frac) {
    const d = parseInt(frac[2]);
    return d !== 0 ? parseInt(frac[1]) / d : null;
  }
  // Mixed number  a b/c
  const mixed = s.match(/^(-?\d+)\s+(\d+)\s*\/\s*(\d+)$/);
  if (mixed) {
    const d = parseInt(mixed[3]);
    return d !== 0 ? parseInt(mixed[1]) + parseInt(mixed[2]) / d : null;
  }
  return null;
}

function checkAnswer(extracted: string, expected: string, matchType: Question["matchType"]): boolean {
  const a = normalizeAnswer(extracted);
  const e = normalizeAnswer(expected);

  if (a === e) return true;

  // Numeric equivalence: 0.5 == 1/2 == .5
  const aNum = parseNumeric(a);
  const eNum = parseNumeric(e);
  if (aNum !== null && eNum !== null) {
    return Math.abs(aNum - eNum) < 1e-6;
  }

  // Starts-with fallback: model wrote extra words after the answer
  // e.g. "yes, all bloops are lazzies" when expected is "yes"
  // Check for boundary after the expected value (space, comma, period)
  if (a.startsWith(e + " ") || a.startsWith(e + ",") || a.startsWith(e + ".")) return true;

  if (matchType === "exact") return false;
  return a.includes(e) || e.includes(a);
}

export async function runQABenchmark(
  modelId: string,
  questionCount: 10 | 20 | 40,
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
        { temperature: 0.1, max_tokens: 1024, stopOnAnswerLine: true },
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
