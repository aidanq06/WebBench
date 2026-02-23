"use client";

import { useEffect, useRef } from "react";
import { useBenchmarkStore } from "@/store/benchmark-store";
import { getTasksForSuite } from "@/lib/benchmark/task-definitions";
import { Badge } from "@/components/ui/badge";
import { CustomerPortal } from "@/components/portal/CustomerPortal";

const PORTAL_SCALE = 0.55;
const PORTAL_WIDTH = 480;
const PORTAL_HEIGHT = 720;

export function BenchmarkProgress({
  portalRef,
}: {
  portalRef: React.RefObject<HTMLDivElement | null>;
}) {
  const { currentTaskIndex, completedResults, currentStepLogs, selectedSuiteId } =
    useBenchmarkStore();
  const logEndRef = useRef<HTMLDivElement>(null);

  const tasks = getTasksForSuite(selectedSuiteId);
  const currentTask = tasks[currentTaskIndex];
  const totalTasks = tasks.length;
  const latestLog = currentStepLogs[currentStepLogs.length - 1];

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentStepLogs.length]);

  return (
    <div className="flex flex-col gap-4">
      {/* progress bar */}
      <div className="flex items-center justify-between">
        <div className="text-sm">
          task {currentTaskIndex + 1} of {totalTasks}
        </div>
        <div className="text-xs text-muted-foreground">
          {completedResults.filter((r) => r.success).length} passed
        </div>
      </div>

      <div className="flex gap-1">
        {tasks.map((_, i) => {
          const result = completedResults[i];
          let bg = "bg-secondary";
          if (i === currentTaskIndex) bg = "bg-primary animate-pulse";
          else if (result?.success) bg = "bg-green-600";
          else if (result && !result.success) bg = "bg-red-600";
          return <div key={i} className={`h-1.5 flex-1 transition-colors duration-300 ${bg}`} />;
        })}
      </div>

      {/* task info */}
      {currentTask && (
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{currentTask.title}</span>
          <Badge variant="secondary" className="text-xs">
            {currentTask.difficulty.toLowerCase()}
          </Badge>
        </div>
      )}

      {/* main content: portal + activity log */}
      <div className="flex gap-4">
        {/* live portal preview */}
        <div
          className="shrink-0 overflow-hidden border"
          style={{
            width: PORTAL_WIDTH * PORTAL_SCALE,
            height: PORTAL_HEIGHT * PORTAL_SCALE,
          }}
        >
          <div
            className="pointer-events-none origin-top-left"
            style={{ transform: `scale(${PORTAL_SCALE})` }}
          >
            <CustomerPortal ref={portalRef} />
          </div>
        </div>

        {/* activity feed */}
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          {/* agent thought bubble */}
          {latestLog && (
            <div
              key={latestLog.stepNumber}
              className="animate-fade-in border-l-2 border-muted-foreground/30 pl-3"
            >
              <div className="text-[10px] text-muted-foreground">thinking</div>
              <div className="text-xs italic text-muted-foreground">
                {latestLog.action.reason}
              </div>
            </div>
          )}

          {/* step log */}
          <div className="flex max-h-72 flex-col gap-1.5 overflow-y-auto">
            {currentStepLogs.map((log) => (
              <div
                key={log.stepNumber}
                className="animate-fade-in flex items-start gap-2 text-xs"
              >
                <span className="shrink-0 text-muted-foreground/50">
                  {log.stepNumber}
                </span>
                <div className="min-w-0">
                  <span className="font-medium">{log.action.action}</span>
                  {log.action.target && (
                    <span className="text-muted-foreground">
                      {" "}→ {log.action.target}
                    </span>
                  )}
                  {log.action.value && (
                    <span className="text-muted-foreground/60">
                      {" "}&quot;{log.action.value.substring(0, 50)}&quot;
                    </span>
                  )}
                </div>
                {log.action.action === "done" && (
                  <span className="ml-auto shrink-0 text-green-600">●</span>
                )}
                {log.action.action === "fail" && (
                  <span className="ml-auto shrink-0 text-red-600">●</span>
                )}
              </div>
            ))}
            <div ref={logEndRef} />
          </div>

          {/* step counter */}
          <div className="text-[10px] text-muted-foreground">
            step {currentStepLogs.length} / {useBenchmarkStore.getState().config.maxSteps}
          </div>
        </div>
      </div>
    </div>
  );
}
