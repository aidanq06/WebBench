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
  // --- Hard tasks ---
  {
    id: "TH1",
    title: "Resolve all Critical tickets",
    description:
      "Find and mark all tickets with Critical priority as Resolved.",
    evaluator: (_, state) =>
      state.tickets
        .filter((t) => t.priority === "Critical")
        .every((t) => t.status === "Resolved"),
    difficulty: "Hard",
    category: "write",
  },
  {
    id: "TH2",
    title: "Reply and resolve ticket",
    description:
      'Reply to ticket TKT-006 with "Fixed in iOS 17.1 update" and then mark it as Resolved.',
    evaluator: (_, state) => {
      const ticket = state.tickets.find((t) => t.id === "TKT-006");
      return (
        (ticket?.replies.some((r) =>
          r.content.toLowerCase().includes("ios 17.1")
        ) ?? false) && ticket?.status === "Resolved"
      );
    },
    difficulty: "Hard",
    category: "write",
  },
  {
    id: "TH3",
    title: "Count tickets per user",
    description:
      'Count how many tickets each user has and call done with a summary like "Jane Doe:3, Bob Smith:2, Carol Lee:2, Dan Brown:1".',
    evaluator: (answer) => {
      const a = answer.toLowerCase();
      return (
        a.includes("3") &&
        a.includes("2") &&
        a.includes("1") &&
        a.includes("jane") &&
        a.includes("bob") &&
        a.includes("carol") &&
        a.includes("dan")
      );
    },
    difficulty: "Hard",
    category: "read",
  },
  {
    id: "TH4",
    title: "Create and navigate",
    description:
      'Create a new ticket for user "Dan Brown" with subject "Database migration failed" and priority Critical, then navigate to the dashboard.',
    evaluator: (_, state) =>
      state.tickets.some(
        (t) =>
          t.userId === "U4" &&
          t.subject.toLowerCase().includes("migration") &&
          t.priority === "Critical"
      ) && state.view.type === "dashboard",
    difficulty: "Hard",
    category: "write",
  },
  {
    id: "TH5",
    title: "Bulk status update",
    description: 'Change all tickets with status "Open" to "In Progress".',
    evaluator: (_, state) =>
      state.tickets.every((t) => t.status !== "Open"),
    difficulty: "Hard",
    category: "write",
  },
];

export const TASK_SUITES: TaskSuite[] = [
  {
    id: "easy",
    name: "easy",
    description: "simple navigation and read-only tasks",
    taskIds: ["TE1", "TE2", "TE3", "TE4", "TE5"],
  },
  {
    id: "standard",
    name: "standard",
    description: "the original 8-task benchmark suite",
    taskIds: ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8"],
  },
  {
    id: "hard",
    name: "hard",
    description: "complex multi-step tasks",
    taskIds: ["TH1", "TH2", "TH3", "TH4", "TH5"],
  },
  {
    id: "all",
    name: "all",
    description: "every task across all difficulty levels",
    taskIds: [
      "TE1", "TE2", "TE3", "TE4", "TE5",
      "T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8",
      "TH1", "TH2", "TH3", "TH4", "TH5",
    ],
  },
];

export function getTasksForSuite(suiteId: string): TaskDefinition[] {
  const suite = TASK_SUITES.find((s) => s.id === suiteId);
  if (!suite) return TASK_DEFINITIONS.filter((t) => t.id.startsWith("T") && !t.id.startsWith("TE") && !t.id.startsWith("TH"));
  return suite.taskIds
    .map((id) => TASK_DEFINITIONS.find((t) => t.id === id))
    .filter(Boolean) as TaskDefinition[];
}
