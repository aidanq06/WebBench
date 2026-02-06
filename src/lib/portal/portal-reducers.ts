import { PortalState, PortalView, TicketStatus, Ticket } from "@/types/portal";

export type PortalAction =
  | { type: "NAVIGATE"; view: PortalView }
  | { type: "MARK_RESOLVED"; ticketId: string }
  | { type: "CHANGE_STATUS"; ticketId: string; status: TicketStatus }
  | { type: "ADD_REPLY"; ticketId: string; content: string; authorName: string }
  | { type: "CREATE_TICKET"; ticket: Omit<Ticket, "id" | "createdAt" | "updatedAt" | "replies"> };

export function portalReducer(state: PortalState, action: PortalAction): PortalState {
  switch (action.type) {
    case "NAVIGATE":
      return { ...state, view: action.view };
    case "MARK_RESOLVED":
      return {
        ...state,
        tickets: state.tickets.map((t) =>
          t.id === action.ticketId ? { ...t, status: "Resolved" as const } : t
        ),
      };
    case "CHANGE_STATUS":
      return {
        ...state,
        tickets: state.tickets.map((t) =>
          t.id === action.ticketId ? { ...t, status: action.status } : t
        ),
      };
    case "ADD_REPLY":
      return {
        ...state,
        tickets: state.tickets.map((t) =>
          t.id === action.ticketId
            ? {
                ...t,
                replies: [
                  ...t.replies,
                  {
                    id: `R${Date.now()}`,
                    authorName: action.authorName,
                    content: action.content,
                    timestamp: new Date().toISOString(),
                  },
                ],
              }
            : t
        ),
      };
    case "CREATE_TICKET": {
      const newTicket: Ticket = {
        ...action.ticket,
        id: `TKT-${String(state.tickets.length + 1).padStart(3, "0")}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        replies: [],
      };
      return { ...state, tickets: [...state.tickets, newTicket] };
    }
    default:
      return state;
  }
}
