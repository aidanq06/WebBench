import { QuestionResult } from "@/types/task";
import {
  BenchmarkReport,
  SubjectScore,
  DifficultyScore,
  HardwareInfo,
  ConfidenceInterval,
} from "@/types/report";
import { Subject, Difficulty } from "@/types/agent";
import { AVAILABLE_MODELS } from "@/lib/webllm/models";
import { SCORING } from "./scoring-config";

const SUBJECTS: Subject[] = ["cs", "engineering", "math", "science"];
const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];

// Wilson score interval — more accurate than normal approximation for small n.
export function wilsonInterval(correct: number, total: number): ConfidenceInterval {
  if (total === 0) return { lower: 0, upper: 0, confidence: 0.95 };
  const z = SCORING.ciZ;
  const p = correct / total;
  const denom = 1 + (z * z) / total;
  const center = (p + (z * z) / (2 * total)) / denom;
  const spread = (z * Math.sqrt((p * (1 - p)) / total + (z * z) / (4 * total * total))) / denom;
  return {
    lower: Math.max(0, center - spread),
    upper: Math.min(1, center + spread),
    confidence: 0.95,
  };
}

export function generateReport(
  results: QuestionResult[],
  modelId: string,
  suiteId: string,
  runId: string,
  tokensPerSecond: number,
  hardware: HardwareInfo
): BenchmarkReport {
  const correctCount = results.filter((r) => r.correct).length;
  const overallAccuracy = results.length > 0 ? correctCount / results.length : 0;
  const avgTimeMs =
    results.length > 0
      ? Math.round(results.reduce((sum, r) => sum + r.timeTakenMs, 0) / results.length)
      : 0;

  const model = AVAILABLE_MODELS.find((m) => m.id === modelId);
  const modelDisplayName = model?.displayName ?? modelId;

  const subjectScores: SubjectScore[] = SUBJECTS.map((subject) => {
    const subset = results.filter((r) => r.subject === subject);
    const correct = subset.filter((r) => r.correct).length;
    return {
      subject,
      correct,
      total: subset.length,
      accuracy: subset.length > 0 ? correct / subset.length : 0,
      confidenceInterval: wilsonInterval(correct, subset.length),
    };
  }).filter((s) => s.total > 0);

  const difficultyScores: DifficultyScore[] = DIFFICULTIES.map((difficulty) => {
    const subset = results.filter((r) => r.difficulty === difficulty);
    const correct = subset.filter((r) => r.correct).length;
    return {
      difficulty,
      correct,
      total: subset.length,
      accuracy: subset.length > 0 ? correct / subset.length : 0,
      confidenceInterval: wilsonInterval(correct, subset.length),
    };
  }).filter((s) => s.total > 0);

  const score = Math.round(overallAccuracy * 100);

  return {
    runId,
    modelId,
    modelDisplayName,
    suiteId,
    overallAccuracy,
    correctCount,
    totalQuestions: results.length,
    avgTimeMs,
    tokensPerSecond,
    score,
    confidenceInterval: wilsonInterval(correctCount, results.length),
    hardware,
    subjectScores,
    difficultyScores,
    questionResults: results,
    completedAt: new Date().toISOString(),
  };
}
