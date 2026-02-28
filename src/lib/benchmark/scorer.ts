import { QuestionResult } from "@/types/task";
import { BenchmarkReport, SubjectScore, DifficultyScore } from "@/types/report";
import { Subject, Difficulty } from "@/types/agent";

const SUBJECTS: Subject[] = ["math", "logic", "coding", "reasoning"];
const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];

export function generateReport(
  results: QuestionResult[],
  modelId: string,
  suiteId: string,
  runId: string
): BenchmarkReport {
  const correctCount = results.filter((r) => r.correct).length;
  const overallAccuracy = results.length > 0 ? correctCount / results.length : 0;
  const avgTimeMs =
    results.length > 0
      ? Math.round(results.reduce((sum, r) => sum + r.timeTakenMs, 0) / results.length)
      : 0;

  const subjectScores: SubjectScore[] = SUBJECTS.map((subject) => {
    const subset = results.filter((r) => r.subject === subject);
    const correct = subset.filter((r) => r.correct).length;
    return {
      subject,
      correct,
      total: subset.length,
      accuracy: subset.length > 0 ? correct / subset.length : 0,
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
    };
  }).filter((s) => s.total > 0);

  return {
    runId,
    modelId,
    suiteId,
    overallAccuracy,
    correctCount,
    totalQuestions: results.length,
    avgTimeMs,
    subjectScores,
    difficultyScores,
    questionResults: results,
    completedAt: new Date().toISOString(),
  };
}
