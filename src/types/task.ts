import { Subject, Difficulty } from "./agent";

export interface QuestionResult {
  questionId: string;
  subject: Subject;
  difficulty: Difficulty;
  correct: boolean;
  modelResponse: string;
  extractedAnswer: string;
  expectedAnswer: string;
  timeTakenMs: number;
}

export interface QuestionSuite {
  id: string;
  name: string;
  description: string;
  questionIds: string[];
}
