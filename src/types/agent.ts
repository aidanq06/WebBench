export type ActionType = "click" | "type" | "navigate" | "scroll" | "done" | "fail";

export interface AgentAction {
  action: ActionType;
  target?: string;
  value?: string;
  reason: string;
}

export interface StepLog {
  stepNumber: number;
  observation: string;
  thought: string;
  action: AgentAction;
  timestamp: number;
}
