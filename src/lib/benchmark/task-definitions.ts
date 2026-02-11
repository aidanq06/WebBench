import { TaskDefinition, TaskSuite } from "@/types/task";

export const TASK_DEFINITIONS: TaskDefinition[] = [
  // --- Easy tasks ---
  {
    id: "TE1",
    title: "Navigate to dashboard",
    description: "Navigate to the dashboard view and call done.",
    evaluator: (_, state) => state.view.type === "dashboard",
    difficulty: "Easy",
    category: "navigate",
  },
  {
    id: "TE2",
    title: "Count total tickets",
    description:
      "Count the total number of tickets in the system and call done with that number.",
    expectedAnswer: "8",
    evaluator: (answer) => answer.includes("8"),
    difficulty: "Easy",
    category: "read",
  },
  {
    id: "TE3",
    title: "Find ticket subject",
    description:
      "Open ticket TKT-003 and call done with its subject line.",
    expectedAnswer: "Feature request: dark mode",
    evaluator: (answer) => answer.toLowerCase().includes("dark mode"),
    difficulty: "Easy",
    category: "read",
  },
  {
    id: "TE4",
    title: "Find any Critical ticket",
    description:
      "Find any ticket with Critical priority and call done with its ID.",
    evaluator: (answer) =>
      answer.includes("TKT-001") || answer.includes("TKT-006"),
    difficulty: "Easy",
    category: "read",
  },
  {
    id: "TE5",
    title: "Read user email",
    description:
      'Find the email address of user "Carol Lee" and call done with it.',
    expectedAnswer: "carol@example.com",
    evaluator: (answer) => answer.includes("carol@example.com"),
    difficulty: "Easy",
    category: "read",
  },
  // --- Standard tasks ---
  {
    id: "T1",
    title: "Find highest priority open ticket",
    description:
      'Find the ticket ID of the highest priority Open ticket and call done with that ticket ID.',
    expectedAnswer: "TKT-001",
    evaluator: (answer) => answer.includes("TKT-001"),
    difficulty: "Easy",
    category: "read",
  },
  {
    id: "T2",
    title: "Mark ticket resolved",
    description: "Mark ticket TKT-004 as Resolved.",
    evaluator: (_, state) =>
      state.tickets.find((t) => t.id === "TKT-004")?.status === "Resolved",
    difficulty: "Easy",
    category: "write",
  },
  {
    id: "T3",
    title: "Find tickets from Jane Doe",
    description:
      'Find all ticket IDs that belong to user "Jane Doe" and call done with the comma-separated list.',
    expectedAnswer: "TKT-001,TKT-003,TKT-005",
    evaluator: (answer) =>
      ["TKT-001", "TKT-003", "TKT-005"].every((id) => answer.includes(id)),
    difficulty: "Medium",
    category: "read",
  },
  {
    id: "T4",
    title: "Reply to a ticket",
    description:
      'Reply to ticket TKT-002 with the message: "We are investigating this issue and will update you shortly."',
    evaluator: (_, state) => {
      const ticket = state.tickets.find((t) => t.id === "TKT-002");
      return (
        ticket?.replies.some((r) =>
          r.content.toLowerCase().includes("investigating")
        ) ?? false
      );
    },
    difficulty: "Medium",
    category: "write",
  },
  {
    id: "T5",
    title: "Create a new ticket",
    description:
      'Create a new support ticket for user "Bob Smith" with subject "API rate limit exceeded" and priority High.',
    evaluator: (_, state) =>
      state.tickets.some(
        (t) =>
          t.userId === "U2" &&
          t.subject.toLowerCase().includes("rate limit") &&
          t.priority === "High"
      ),
    difficulty: "Hard",
    category: "write",
  },
  {
    id: "T6",
    title: "Find ticket by keyword",
    description:
      'Find the ticket ID with subject containing the word "export" and call done with that ticket ID.',
    expectedAnswer: "TKT-004",
    evaluator: (answer) => answer.includes("TKT-004"),
    difficulty: "Easy",
    category: "read",
  },
  {
    id: "T7",
    title: "Change ticket status",
    description: "Change the status of ticket TKT-001 from Open to In Progress.",
    evaluator: (_, state) =>
      state.tickets.find((t) => t.id === "TKT-001")?.status === "In Progress",
    difficulty: "Medium",
    category: "write",
  },
  {
    id: "T8",
    title: "Count open tickets",
    description:
      'Count how many tickets currently have status "Open" and call done with that number.',
    expectedAnswer: "6",
    evaluator: (answer) => answer.trim() === "6" || answer.includes("6"),
    difficulty: "Easy",
    category: "read",
  },
];
