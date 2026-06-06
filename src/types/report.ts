import { QuestionResult } from "./task";
import { Subject, Difficulty } from "./agent";

export interface ConfidenceInterval {
  lower: number;   // 0–1
  upper: number;   // 0–1
  confidence: 0.95;
}

export interface SubjectScore {
  subject: Subject;
  correct: number;
  total: number;
  accuracy: number;
  confidenceInterval: ConfidenceInterval;
}

export interface DifficultyScore {
  difficulty: Difficulty;
  correct: number;
  total: number;
  accuracy: number;
  confidenceInterval: ConfidenceInterval;
}

export type DeviceClass = "apple-silicon" | "nvidia" | "amd" | "intel" | "mobile" | "unknown";

export interface HardwareInfo {
  gpuVendor: string;
  gpuDevice: string;
  deviceClass: DeviceClass;
  cpuThreads: number;
  browser: string;
  os: string;
  webgpuBackend: string;
  maxBufferBytes: number;
}

export interface BenchmarkReport {
  runId: string;
  modelId: string;
  modelDisplayName: string;
  suiteId: string;
  overallAccuracy: number;
  correctCount: number;
  totalQuestions: number;
  avgTimeMs: number;
  tokensPerSecond: number;
  score: number;                         // accuracy as integer percentage 0–100
  confidenceInterval: ConfidenceInterval;
  hardware: HardwareInfo;
  subjectScores: SubjectScore[];
  difficultyScores: DifficultyScore[];
  questionResults: QuestionResult[];
  completedAt: string;
}
