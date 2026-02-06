"use client";

import { useState } from "react";
import { usePortalStore } from "@/store/portal-store";
import { Badge } from "@/components/ui/badge";
import { TicketStatus } from "@/types/portal";

const STATUSES: TicketStatus[] = ["Open", "In Progress", "Resolved", "Closed"];

export function TicketDetail({ ticketId }: { ticketId: string }) {
  const { portalState, dispatch } = usePortalStore();
  const [replyText, setReplyText] = useState("");

  const ticket = portalState.tickets.find((t) => t.id === ticketId);
  const user = portalState.users.find((u) => u.id === ticket?.userId);

  if (!ticket) {
    return <div className="p-4 text-sm text-muted-foreground">ticket not found</div>;
  }

  const handleReply = () => {
    if (!replyText.trim()) return;
    dispatch({
      type: "ADD_REPLY",
      ticketId: ticket.id,
      content: replyText,
      authorName: "Agent",
    });
    setReplyText("");
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <button
        aria-label="Back to tickets"
        data-action="back-to-tickets"
        className="text-xs text-muted-foreground hover:text-foreground"
        onClick={() =>
          dispatch({ type: "NAVIGATE", view: { type: "ticket-list" } })
        }
      >
        ← back to tickets
      </button>

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-medium">{ticket.subject}</h2>
          <Badge variant="secondary">{ticket.status}</Badge>
        </div>
        <div className="flex gap-2 text-xs text-muted-foreground">
          <span>{ticket.id}</span>
          <span>·</span>
          <span>{user?.name}</span>
          <span>·</span>
          <span>{ticket.priority}</span>
        </div>
      </div>

      <div className="border p-3 text-sm" aria-label="Ticket description">
        {ticket.description}
      </div>

      <div className="flex gap-2">
        {STATUSES.map((status) => (
          <button
            key={status}
            aria-label={`Mark as ${status}`}
            data-action={`change-status-${status.toLowerCase().replace(" ", "-")}`}
            className={`border px-3 py-1 text-xs hover:bg-accent/50 ${
              ticket.status === status ? "bg-accent text-accent-foreground" : ""
            }`}
            onClick={() =>
              dispatch({ type: "CHANGE_STATUS", ticketId: ticket.id, status })
            }
          >
            {status.toLowerCase()}
          </button>
        ))}
      </div>

      {ticket.replies.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-medium">replies</h3>
          {ticket.replies.map((reply) => (
            <div key={reply.id} className="border p-3 text-sm" aria-label={`Reply from ${reply.authorName}`}>
              <div className="text-xs text-muted-foreground">{reply.authorName}</div>
              <div>{reply.content}</div>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <textarea
          aria-label="Reply message"
          placeholder="type your reply..."
          value={replyText}
          onChange={(e) => setReplyText(e.target.value)}
          className="border bg-background p-2 text-sm placeholder:text-muted-foreground focus:outline-none"
          rows={3}
        />
        <button
          aria-label="Send reply"
          data-action="send-reply"
          className="self-start border px-3 py-1 text-sm hover:bg-accent/50"
          onClick={handleReply}
        >
          send reply
        </button>
      </div>
    </div>
  );
}
