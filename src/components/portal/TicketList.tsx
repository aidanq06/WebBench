"use client";

import { usePortalStore } from "@/store/portal-store";
import { Badge } from "@/components/ui/badge";

const priorityOrder = { Critical: 0, High: 1, Medium: 2, Low: 3 };

export function TicketList() {
  const { portalState, dispatch } = usePortalStore();
  const { tickets, users } = portalState;

  const sorted = [...tickets].sort(
    (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
  );

  return (
    <div className="flex flex-col gap-2 p-4">
      <h2 className="text-lg font-medium">all tickets</h2>
      <div className="flex flex-col border">
        {sorted.map((ticket) => {
          const user = users.find((u) => u.id === ticket.userId);
          return (
            <button
              key={ticket.id}
              role="row"
              aria-label={`Ticket ${ticket.id}: ${ticket.subject}`}
              data-action="navigate-ticket"
              data-ticket-id={ticket.id}
              className="flex items-center gap-3 border-b px-4 py-3 text-left text-sm last:border-b-0 hover:bg-accent/50"
              onClick={() =>
                dispatch({
                  type: "NAVIGATE",
                  view: { type: "ticket-detail", ticketId: ticket.id },
                })
              }
            >
              <span className="w-16 shrink-0 text-xs text-muted-foreground">
                {ticket.id}
              </span>
              <span className="flex-1 truncate">{ticket.subject}</span>
              <Badge variant="secondary" className="shrink-0 text-xs">
                {ticket.status}
              </Badge>
              <Badge variant="outline" className="shrink-0 text-xs">
                {ticket.priority}
              </Badge>
              <span className="w-20 shrink-0 truncate text-xs text-muted-foreground">
                {user?.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
