export type TicketStatus = "Open" | "In Progress" | "Resolved" | "Closed";
export type TicketPriority = "Low" | "Medium" | "High" | "Critical";

export interface User {
  id: string;
  name: string;
  email: string;
  avatarInitials: string;
}

export interface TicketReply {
  id: string;
  authorName: string;
  content: string;
  timestamp: string;
}

export interface Ticket {
  id: string;
  subject: string;
  status: TicketStatus;
  priority: TicketPriority;
  userId: string;
  createdAt: string;
  updatedAt: string;
  description: string;
  replies: TicketReply[];
  tags: string[];
}

export type PortalView =
  | { type: "dashboard" }
  | { type: "ticket-list" }
  | { type: "ticket-detail"; ticketId: string }
  | { type: "user-profile"; userId: string }
  | { type: "create-ticket" };

export interface PortalState {
  view: PortalView;
  tickets: Ticket[];
  users: User[];
}
