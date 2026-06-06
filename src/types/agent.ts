export type Subject = "cs" | "engineering" | "math" | "science";
export type Difficulty = "easy" | "medium" | "hard";

export interface Question {
  id: string;
  subject: Subject;
  difficulty: Difficulty;
  subcategory?: string;
  text: string;
  choices: [string, string, string, string];
  expectedAnswer: "A" | "B" | "C" | "D";
}
