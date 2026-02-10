import { PortalState } from "./portal";
import { StepLog } from "./agent";

export interface TaskDefinition {
  id: string;
  title: string;
  description: string;
  expectedAnswer?: string;
  evaluator: (agentAnswer: string, finalState: PortalState) => boolean;
  difficulty: "Easy" | "Medium" | "Hard";
  category: "read" | "write" | "navigate";
}

export interface TaskSuite {
  id: string;
  name: string;
  description: string;
  taskIds: string[];
}

export interface TaskResult {
  taskId: string;
  success: boolean;
  stepsUsed: number;
  timeTakenMs: number;
  finalAnswer: string;
  stepLogs: StepLog[];
  maxSteps: number;
}
