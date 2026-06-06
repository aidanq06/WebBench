import { Subject, Difficulty } from "./agent";
import type { ExtractSource } from "@/lib/benchmark/answer-extractor";

export interface QuestionResult {
  questionId: string;
  subject: Subject;
  difficulty: Difficulty;
  correct: boolean;
  modelResponse: string;        // full unedited stream from the model
  extractedAnswer: string;      // "A" | "B" | "C" | "D" | "" (empty = no answer found)
  extractionSource: ExtractSource;
  expectedAnswer: string;
  timeTakenMs: number;
}

export interface QuestionSuite {
  id: string;
  name: string;
  description: string;
  questionIds: string[];
}
