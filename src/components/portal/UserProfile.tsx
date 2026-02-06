"use client";

import { usePortalStore } from "@/store/portal-store";
import { Badge } from "@/components/ui/badge";

export function UserProfile({ userId }: { userId: string }) {
  const { portalState, dispatch } = usePortalStore();

  const user = portalState.users.find((u) => u.id === userId);
  const userTickets = portalState.tickets.filter((t) => t.userId === userId);

  if (!user) {
    return <div className="p-4 text-sm text-muted-foreground">user not found</div>;
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center border text-sm font-medium">
          {user.avatarInitials}
        </div>
        <div>
          <div className="font-medium">{user.name}</div>
          <div className="text-xs text-muted-foreground">{user.email}</div>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-medium">tickets ({userTickets.length})</h3>
        {userTickets.map((ticket) => (
          <button
            key={ticket.id}
            aria-label={`Ticket ${ticket.id}: ${ticket.subject}`}
            data-action="navigate-ticket"
            data-ticket-id={ticket.id}
            className="flex items-center gap-2 border px-3 py-2 text-left text-sm hover:bg-accent/50"
            onClick={() =>
              dispatch({
                type: "NAVIGATE",
                view: { type: "ticket-detail", ticketId: ticket.id },
              })
            }
          >
            <span className="text-xs text-muted-foreground">{ticket.id}</span>
            <span className="flex-1 truncate">{ticket.subject}</span>
            <Badge variant="secondary" className="text-xs">
              {ticket.status}
            </Badge>
          </button>
        ))}
      </div>
    </div>
  );
}
