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

export type DeviceClass = "apple-silicon" | "nvidia" | "amd" | "intel" | "mobile" | "unknown";

export interface HardwareInfo {
  gpuVendor: string;
  gpuDevice: string;
  deviceClass: DeviceClass;
  cpuThreads: number;
  browser: string;
  os: string;
  webgpuBackend: string;
  maxBufferBytes: number; // adapter.limits.maxBufferSize — proxy for available GPU memory
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
  efficiencyScore: number;
  score: number;
  hardware: HardwareInfo;
  subjectScores: SubjectScore[];
  difficultyScores: DifficultyScore[];
  questionResults: QuestionResult[];
  completedAt: string;
}
