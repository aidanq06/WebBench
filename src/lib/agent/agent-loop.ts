import { generateCompletion } from "@/lib/webllm/engine-client";
import { extractAccessibilityTree } from "./accessibility-tree";
import { executeAction } from "./action-executor";
import { SYSTEM_PROMPT } from "./prompts";
import { AgentAction, StepLog } from "@/types/agent";
import { TaskDefinition, TaskResult } from "@/types/task";
import { usePortalStore } from "@/store/portal-store";

export interface AgentRunOptions {
  maxSteps: number;
  maxTimeMs: number;
  onStep: (log: StepLog) => void;
  portalRef: React.RefObject<HTMLDivElement | null>;
}

export async function runAgentOnTask(
  task: TaskDefinition,
  options: AgentRunOptions
): Promise<TaskResult> {
  const startTime = Date.now();
  const steps: StepLog[] = [];
  const messages: { role: string; content: string }[] = [
    {
      role: "system",
      content: SYSTEM_PROMPT.replace("{TASK_DESCRIPTION}", task.description),
    },
  ];

  let success = false;
  let finalAnswer = "";

  for (let step = 1; step <= options.maxSteps; step++) {
    if (Date.now() - startTime > options.maxTimeMs) {
      break;
    }

    const observation = extractAccessibilityTree(options.portalRef.current!);
    messages.push({ role: "user", content: `Observation:\n${observation}` });

    let rawResponse = "";
    try {
      rawResponse = await generateCompletion(messages, {
        temperature: 0.1,
        max_tokens: 256,
      });
    } catch {
      break;
    }

    let action: AgentAction;
    try {
      const jsonStr = rawResponse.replace(/```json?\n?|```/g, "").trim();
      action = JSON.parse(jsonStr);
    } catch {
      messages.push({ role: "assistant", content: rawResponse });
      const stepLog: StepLog = {
        stepNumber: step,
        observation,
        thought: "malformed output",
        action: { action: "fail", reason: "could not parse response" },
        timestamp: Date.now(),
      };
      steps.push(stepLog);
      options.onStep(stepLog);
      continue;
    }

    const stepLog: StepLog = {
      stepNumber: step,
      observation,
      thought: action.reason,
      action,
      timestamp: Date.now(),
    };
    steps.push(stepLog);
    options.onStep(stepLog);
    messages.push({ role: "assistant", content: rawResponse });

    if (action.action === "done") {
      success = task.evaluator(
        action.value ?? "",
        usePortalStore.getState().portalState
      );
      finalAnswer = action.value ?? "";
      break;
    }

    if (action.action === "fail") {
      break;
    }

    await executeAction(action, options.portalRef);
    await new Promise((r) => setTimeout(r, 100));
  }

  return {
    taskId: task.id,
    success,
    stepsUsed: steps.length,
    timeTakenMs: Date.now() - startTime,
    finalAnswer,
    stepLogs: steps,
    maxSteps: options.maxSteps,
  };
}
