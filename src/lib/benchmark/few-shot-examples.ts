import type { Subject } from "@/types/agent";

interface FewShotExample {
  text: string;
  choices: [string, string, string, string];
  answer: "A" | "B" | "C" | "D";
  reasoning: string;
}

// Five hand-written examples per subject — kept out of the test question pool.
// Each demonstrates the brief-reasoning → `ANSWER: X` format the model should
// follow, so it learns the expected output shape from context.
const FEW_SHOT_EXAMPLES: Record<Subject, FewShotExample[]> = {
  cs: [
    {
      text: "Which sorting algorithm guarantees O(n log n) time complexity in all cases?",
      choices: ["Bubble sort", "Insertion sort", "Merge sort", "Selection sort"],
      answer: "C",
      reasoning: "Merge sort recursively splits the input and merges in linear time, giving O(n log n) in best, average, and worst cases — unlike quicksort which can degrade to O(n²).",
    },
    {
      text: "In object-oriented programming, which principle states that a subclass should be substitutable for its superclass?",
      choices: [
        "Open/Closed Principle",
        "Liskov Substitution Principle",
        "Interface Segregation Principle",
        "Dependency Inversion Principle",
      ],
      answer: "B",
      reasoning: "The Liskov Substitution Principle (B) defines exactly this: any subtype must be usable wherever its supertype is expected, preserving the program's correctness.",
    },
    {
      text: "What is the output of a cryptographic hash function typically called?",
      choices: ["Key", "Value", "Digest", "Token"],
      answer: "C",
      reasoning: "A cryptographic hash maps arbitrary input to a fixed-length output that uniquely fingerprints the input — that output is called a digest (C).",
    },
    {
      text: "Which protocol operates at the transport layer of the OSI model?",
      choices: ["IP", "HTTP", "TCP", "ARP"],
      answer: "C",
      reasoning: "TCP (C) is the canonical transport-layer protocol providing reliable byte streams; IP is layer 3 (network), HTTP is layer 7, ARP is layer 2.",
    },
    {
      text: "In a relational database, a foreign key:",
      choices: [
        "Uniquely identifies each row in a table",
        "References the primary key of another table",
        "Indexes a column for faster search",
        "Encrypts sensitive data at rest",
      ],
      answer: "B",
      reasoning: "A foreign key's defining purpose is to enforce a referential link to another table's primary key (B); unique identification is the primary key's role.",
    },
  ],
  engineering: [
    {
      text: "What is the SI unit of electrical resistance?",
      choices: ["Ampere", "Volt", "Ohm", "Watt"],
      answer: "C",
      reasoning: "Electrical resistance is measured in ohms (C, symbol Ω); ampere measures current, volt measures potential, and watt measures power.",
    },
    {
      text: "Which law states that the current through a conductor is directly proportional to the voltage across it?",
      choices: ["Faraday's Law", "Newton's Second Law", "Ohm's Law", "Kirchhoff's Voltage Law"],
      answer: "C",
      reasoning: "Ohm's law (C), V = IR, states that current scales linearly with voltage at fixed resistance — Faraday's deals with induction, Kirchhoff's with loops.",
    },
    {
      text: "What type of feedback in a control system reduces gain and improves stability?",
      choices: ["Positive feedback", "Negative feedback", "Open-loop control", "Feed-forward control"],
      answer: "B",
      reasoning: "Negative feedback (B) subtracts a portion of the output from the input, which both reduces the closed-loop gain and damps oscillations, improving stability.",
    },
    {
      text: "In fluid mechanics, the Reynolds number characterizes:",
      choices: [
        "Pressure drop across a restriction",
        "The ratio of inertial to viscous forces",
        "Heat transfer rate at a surface",
        "Fluid compressibility",
      ],
      answer: "B",
      reasoning: "Reynolds number is defined as Re = ρvL/μ, which is exactly the ratio of inertial to viscous forces (B) and predicts laminar vs turbulent flow.",
    },
    {
      text: "Which failure mode occurs when a material is subjected to repeated cyclic loading below its yield strength?",
      choices: ["Creep", "Brittle fracture", "Fatigue", "Plastic deformation"],
      answer: "C",
      reasoning: "Fatigue (C) is failure from repeated cyclic loading even below yield, accumulating microscopic cracks; creep is slow deformation under constant load.",
    },
  ],
  math: [
    {
      text: "What is the derivative of f(x) = x³ with respect to x?",
      choices: ["x²", "3x²", "3x", "x⁴/4"],
      answer: "B",
      reasoning: "By the power rule, d/dx[xⁿ] = n·xⁿ⁻¹, so d/dx[x³] = 3x², which matches B; x⁴/4 would be the antiderivative.",
    },
    {
      text: "The integral of 1/x dx equals:",
      choices: ["x²/2 + C", "ln|x| + C", "1/x² + C", "e^x + C"],
      answer: "B",
      reasoning: "The natural logarithm is defined so that d/dx[ln|x|] = 1/x, making ln|x| + C (B) the antiderivative of 1/x.",
    },
    {
      text: "If a matrix A has eigenvalue λ with eigenvector v, which equation holds?",
      choices: ["Av = λv", "Av = v/λ", "A + v = λ", "λA = v"],
      answer: "A",
      reasoning: "By the very definition of an eigenpair, applying A to v scales v by the eigenvalue: Av = λv, which is A.",
    },
    {
      text: "What is lim_{x→0} sin(x)/x?",
      choices: ["0", "∞", "1", "Undefined"],
      answer: "C",
      reasoning: "Using the Taylor series sin(x) = x − x³/6 + …, sin(x)/x → 1 as x → 0, which is the standard foundational limit (C).",
    },
    {
      text: "In the integers modulo a prime p, every non-zero element has:",
      choices: [
        "No multiplicative inverse",
        "Order equal to 1",
        "A multiplicative inverse",
        "A unique additive identity",
      ],
      answer: "C",
      reasoning: "When p is prime, Z/pZ forms a field, so every non-zero element has a multiplicative inverse (C) — this fails for composite moduli.",
    },
  ],
  science: [
    {
      text: "What is the chemical formula for water?",
      choices: ["CO₂", "H₂O", "NaCl", "O₂"],
      answer: "B",
      reasoning: "Water consists of two hydrogen atoms covalently bonded to a single oxygen atom, giving the formula H₂O (B); CO₂ is carbon dioxide and NaCl is salt.",
    },
    {
      text: "Which of Newton's laws states that every action has an equal and opposite reaction?",
      choices: ["First law", "Second law", "Third law", "Law of universal gravitation"],
      answer: "C",
      reasoning: "Newton's third law (C) explicitly pairs every force with an equal-and-opposite reaction; the first describes inertia and the second relates force, mass, and acceleration.",
    },
    {
      text: "Which organelle is responsible for ATP production via oxidative phosphorylation?",
      choices: ["Nucleus", "Ribosome", "Mitochondria", "Golgi apparatus"],
      answer: "C",
      reasoning: "Mitochondria (C) house the electron transport chain whose proton gradient powers ATP synthase — ribosomes synthesize proteins, the Golgi packages them.",
    },
    {
      text: "What type of bond holds the two complementary strands of a DNA double helix together?",
      choices: ["Covalent bonds", "Ionic bonds", "Hydrogen bonds", "Metallic bonds"],
      answer: "C",
      reasoning: "Complementary base pairs A–T and G–C are held by hydrogen bonds (C) across the helix; covalent bonds hold each strand's backbone together internally.",
    },
    {
      text: "According to special relativity, as an object's velocity approaches the speed of light, its relativistic mass:",
      choices: [
        "Decreases toward zero",
        "Remains constant",
        "Increases without bound",
        "Becomes imaginary",
      ],
      answer: "C",
      reasoning: "The Lorentz factor γ = 1/√(1−v²/c²) diverges as v → c, so relativistic mass increases without bound (C), making infinite energy required to reach c.",
    },
  ],
};

export function getFewShotMessages(
  subject: Subject
): { role: string; content: string }[] {
  const examples = FEW_SHOT_EXAMPLES[subject];
  const messages: { role: string; content: string }[] = [];

  const LETTERS = ["A", "B", "C", "D"] as const;
  for (const ex of examples) {
    const choicesText = ex.choices
      .map((c, idx) => `${LETTERS[idx]}. ${c}`)
      .join("\n");
    messages.push({
      role: "user",
      content: `${ex.text}\n\n${choicesText}`,
    });
    messages.push({
      role: "assistant",
      content: `${ex.reasoning}\n\nANSWER: ${ex.answer}`,
    });
  }

  return messages;
}
