"use client";

import { BenchmarkReport } from "@/types/report";
import { TASK_DEFINITIONS } from "@/lib/benchmark/task-definitions";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function TaskResultsTable({ report }: { report: BenchmarkReport }) {
  return (
    <div className="border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-xs">task</TableHead>
            <TableHead className="text-xs">status</TableHead>
            <TableHead className="text-xs">steps</TableHead>
            <TableHead className="text-xs">time</TableHead>
            <TableHead className="text-xs">score</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {report.taskResults.map((result) => {
            const task = TASK_DEFINITIONS.find((t) => t.id === result.taskId);
            const score = report.taskScores.find(
              (s) => s.taskId === result.taskId
            );
            return (
              <TableRow key={result.taskId}>
                <TableCell className="text-sm">
                  {task?.title ?? result.taskId}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={result.success ? "secondary" : "destructive"}
                    className="text-xs"
                  >
                    {result.success ? "pass" : "fail"}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm">{result.stepsUsed}</TableCell>
                <TableCell className="text-sm">
                  {(result.timeTakenMs / 1000).toFixed(1)}s
                </TableCell>
                <TableCell className="text-sm">
                  {score?.rawScore ?? 0}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
