"use client";

import { usePortalStore } from "@/store/portal-store";

export function PortalDashboard() {
  const { portalState } = usePortalStore();
  const { tickets } = portalState;

  const openCount = tickets.filter((t) => t.status === "Open").length;
  const inProgressCount = tickets.filter((t) => t.status === "In Progress").length;
  const resolvedCount = tickets.filter((t) => t.status === "Resolved").length;
  const closedCount = tickets.filter((t) => t.status === "Closed").length;

  return (
    <div className="flex flex-col gap-4 p-4">
      <h2 className="text-lg font-medium">dashboard</h2>
      <div className="grid grid-cols-2 gap-3">
        <div className="border bg-card p-3" aria-label={`${openCount} open tickets`}>
          <div className="text-2xl font-medium">{openCount}</div>
          <div className="text-xs text-muted-foreground">open</div>
        </div>
        <div className="border bg-card p-3" aria-label={`${inProgressCount} in progress tickets`}>
          <div className="text-2xl font-medium">{inProgressCount}</div>
          <div className="text-xs text-muted-foreground">in progress</div>
        </div>
        <div className="border bg-card p-3" aria-label={`${resolvedCount} resolved tickets`}>
          <div className="text-2xl font-medium">{resolvedCount}</div>
          <div className="text-xs text-muted-foreground">resolved</div>
        </div>
        <div className="border bg-card p-3" aria-label={`${closedCount} closed tickets`}>
          <div className="text-2xl font-medium">{closedCount}</div>
          <div className="text-xs text-muted-foreground">closed</div>
        </div>
      </div>
    </div>
  );
}
