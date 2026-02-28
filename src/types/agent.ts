export type Subject = "math" | "logic" | "coding" | "reasoning";
export type Difficulty = "easy" | "medium" | "hard";
export type AnswerMatchType = "exact" | "includes";

export interface Question {
  id: string;
  subject: Subject;
  difficulty: Difficulty;
  text: string;
  expectedAnswer: string;
  matchType: AnswerMatchType;
}
