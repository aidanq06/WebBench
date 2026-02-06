"use client";

import { useState } from "react";
import { usePortalStore } from "@/store/portal-store";
import { TicketPriority } from "@/types/portal";

const PRIORITIES: TicketPriority[] = ["Low", "Medium", "High", "Critical"];

export function CreateTicketForm() {
  const { portalState, dispatch } = usePortalStore();
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TicketPriority>("Medium");
  const [selectedUserId, setSelectedUserId] = useState(portalState.users[0]?.id ?? "");

  const handleSubmit = () => {
    if (!subject.trim()) return;
    dispatch({
      type: "CREATE_TICKET",
      ticket: {
        subject,
        description,
        priority,
        status: "Open",
        userId: selectedUserId,
        tags: [],
      },
    });
    setSubject("");
    setDescription("");
    setPriority("Medium");
    dispatch({ type: "NAVIGATE", view: { type: "ticket-list" } });
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <h2 className="text-lg font-medium">create ticket</h2>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-muted-foreground" htmlFor="user-select">
          user
        </label>
        <select
          id="user-select"
          aria-label="Select user"
          value={selectedUserId}
          onChange={(e) => setSelectedUserId(e.target.value)}
          className="border bg-background px-2 py-1.5 text-sm focus:outline-none"
        >
          {portalState.users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-muted-foreground" htmlFor="subject-input">
          subject
        </label>
        <input
          id="subject-input"
          aria-label="Ticket subject"
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="ticket subject..."
          className="border bg-background px-2 py-1.5 text-sm placeholder:text-muted-foreground focus:outline-none"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-muted-foreground" htmlFor="desc-input">
          description
        </label>
        <textarea
          id="desc-input"
          aria-label="Ticket description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="describe the issue..."
          rows={3}
          className="border bg-background px-2 py-1.5 text-sm placeholder:text-muted-foreground focus:outline-none"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-muted-foreground">priority</label>
        <div className="flex gap-1">
          {PRIORITIES.map((p) => (
            <button
              key={p}
              aria-label={`Priority ${p}`}
              data-action={`priority-${p.toLowerCase()}`}
              className={`border px-3 py-1 text-xs hover:bg-accent/50 ${
                priority === p ? "bg-accent text-accent-foreground" : ""
              }`}
              onClick={() => setPriority(p)}
            >
              {p.toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      <button
        aria-label="Create ticket"
        data-action="create-ticket-submit"
        className="self-start border px-4 py-2 text-sm hover:bg-accent/50"
        onClick={handleSubmit}
      >
        create ticket
      </button>
    </div>
  );
}
