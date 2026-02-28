import { QuestionResult } from "./task";
import { Subject, Difficulty } from "./agent";

export interface SubjectScore {
  subject: Subject;
  correct: number;
  total: number;
  accuracy: number;
}

export interface DifficultyScore {
  difficulty: Difficulty;
  correct: number;
  total: number;
  accuracy: number;
}

export interface BenchmarkReport {
  runId: string;
  modelId: string;
  suiteId: string;
  overallAccuracy: number;
  correctCount: number;
  totalQuestions: number;
  avgTimeMs: number;
  subjectScores: SubjectScore[];
  difficultyScores: DifficultyScore[];
  questionResults: QuestionResult[];
  completedAt: string;
}
