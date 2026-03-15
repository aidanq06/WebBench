"use client";

import { useRef, useState, useEffect } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
// AnimatePresence used in ModelPanel
import { AVAILABLE_MODELS, modelLogo } from "@/lib/webllm/models";

// ── Demo questions for panel 2 ───────────────────────────────────────────────
const DEMO_QUESTIONS = [
  {
    subject: "cs",
    difficulty: "medium",
    id: "computer-science-14",
    text: "Which of the following sorting algorithms has the best average-case time complexity?",
    choices: ["Bubble sort", "Insertion sort", "Merge sort", "Selection sort"],
    response: `Bubble, insertion, and selection sort all have O(n²) average-case complexity.\n\nMerge sort uses a divide-and-conquer approach that guarantees O(n log n) in all cases — best, average, and worst.\n\nANSWER: C`,
  },
  {
    subject: "math",
    difficulty: "hard",
    id: "abstract-algebra-07",
    text: "The order of the group Z_6 × Z_2 is:",
    choices: ["6", "8", "12", "3"],
    response: `The order of a direct product of groups is the product of their orders.\n\n|Z_6| = 6, |Z_2| = 2\n|Z_6 × Z_2| = 6 × 2 = 12\n\nANSWER: C`,
  },
  {
    subject: "engineering",
    difficulty: "medium",
    id: "machine-learning-05",
    text: "Which of the following is a hyperparameter in a neural network?",
    choices: ["The weights of the network", "The biases of the network", "The learning rate", "The loss value"],
    response: `Weights and biases are learned parameters — they are updated during training.\nThe loss value is an output metric, not a parameter.\n\nThe learning rate is set before training begins and controls how much weights are updated per step. It is a hyperparameter.\n\nANSWER: C`,
  },
  {
    subject: "science",
    difficulty: "hard",
    id: "college-physics-11",
    text: "A particle moves in a circle of radius r with constant speed v. The magnitude of its acceleration is:",
    choices: ["v/r", "v²/r", "v·r", "v²·r"],
    response: `For uniform circular motion, the centripetal acceleration points toward the center.\n\nThe magnitude is a = v²/r, derived from the rate of change of the velocity vector's direction.\n\nANSWER: B`,
  },
  {
    subject: "cs",
    difficulty: "hard",
    id: "computer-security-08",
    text: "Which type of attack involves an attacker inserting themselves between two communicating parties?",
    choices: ["SQL injection", "Man-in-the-middle", "Cross-site scripting", "Buffer overflow"],
    response: `SQL injection targets databases via malicious queries.\nXSS injects scripts into web pages.\nBuffer overflow exploits memory management.\n\nA man-in-the-middle (MITM) attack intercepts communication between two parties, allowing the attacker to eavesdrop or alter messages.\n\nANSWER: B`,
  },
  {
    subject: "math",
    difficulty: "medium",
    id: "college-mathematics-03",
    text: "The function f(x) = x³ - 3x has local maxima at x =",
    choices: ["x = 0", "x = 1", "x = -1", "x = 3"],
    response: `Take the derivative: f'(x) = 3x² - 3 = 3(x² - 1) = 3(x-1)(x+1)\n\nCritical points at x = ±1.\n\nf''(x) = 6x\nf''(-1) = -6 < 0 → local max at x = -1\nf''(1) = 6 > 0 → local min at x = 1\n\nANSWER: C`,
  },
];

// ── Panel 1: Model grid ───────────────────────────────────────────────────────
const cardContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } },
};

const cardItem = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" as const } },
};

function formatSize(mb: number): string {
  return mb >= 1000 ? `${(mb / 1000).toFixed(1)}gb` : `${mb}mb`;
}

function getFamily(name: string): string {
  if (name.startsWith("qwen")) return "qwen";
  if (name.startsWith("llama")) return "llama";
  if (name.startsWith("gemma")) return "gemma";
  if (name.startsWith("deepseek")) return "deepseek";
  if (name.startsWith("mistral")) return "mistral";
  if (name.startsWith("smollm2")) return "smollm2";
  if (name.startsWith("phi")) return "phi";
  return "other";
}

const MAX_MODEL_SIZE = 5000; // deepseek r1 8b

const MODEL_INFO: Record<string, string> = {
  "qwen3 0.6b": "Alibaba's smallest Qwen3 model. Hybrid reasoning with thinking/non-thinking modes. Punches above its weight for basic Q&A.",
  "llama 3.2 1b": "Meta's compact edge model. Optimized for on-device tasks. Struggles with multi-step reasoning but fast and lightweight.",
  "smollm2 1.7b": "HuggingFace's SmolLM2. Trained specifically for efficiency at small scale. Interesting comparison point against larger models.",
  "gemma 2 2b": "Google DeepMind's Gemma 2. Uses novel interleaved local/global attention. Competitive with models twice its size on some benchmarks.",
  "llama 3.2 3b": "Meta's instruction-tuned 3B. Well-rounded across categories. Good mid-range reference point for the benchmark.",
  "phi 3.5 mini": "Microsoft's Phi-3.5 Mini at 3.8B. Strong reasoning relative to its size. Competitive with larger models on STEM and logic tasks.",
  "qwen3 4b": "Qwen3 4B with extended chain-of-thought support. Strong multilingual reasoning. Often closes the gap with 7B models.",
  "mistral 7b": "Mistral AI's 7B instruction model. Efficient architecture with grouped-query attention. Strong baseline at the 7B tier.",
  "deepseek r1 8b": "DeepSeek R1 distilled into Llama 8B. RL-trained reasoning with open weights. Competitive against much larger models.",
};

function ModelPanel() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "0px 0px -100px 0px" });
  const [activeCard, setActiveCard] = useState<string | null>(null);

  return (
    <div ref={ref} className="flex w-full flex-col gap-8">
      <div className="flex flex-col gap-3">
        <h3 className="text-2xl font-medium tracking-tight">select a model</h3>
        <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
          9 models from 0.6b to 8b parameters — qwen, llama, gemma, phi, deepseek r1, mistral, smollm2. all running locally via webgpu. no api keys. no server.
        </p>
      </div>
      <motion.div
        className="grid grid-cols-3 gap-2"
        variants={cardContainer}
        initial="hidden"
        animate={inView ? "show" : "hidden"}
      >
        {AVAILABLE_MODELS.map((model) => {
          const family = getFamily(model.displayName);
          const sizePct = Math.round((model.estimatedSizeMB / MAX_MODEL_SIZE) * 100);
          const isOpen = activeCard === model.id;
          const description = MODEL_INFO[model.displayName];
          return (
            <motion.div
              key={model.id}
              variants={cardItem}
              whileHover={{ y: isOpen ? 0 : -2, transition: { duration: 0.15 } }}
              onClick={() => setActiveCard(isOpen ? null : model.id)}
              className="group flex cursor-pointer flex-col gap-3 border px-4 py-4 transition-colors hover:border-foreground/20 hover:bg-accent/30"
              style={{ borderColor: isOpen ? "hsl(var(--foreground) / 0.2)" : undefined }}
            >
              {(() => {
                const logo = modelLogo(model.id);
                return logo ? (
                  <img src={logo} alt="" className="h-6 w-6 object-contain" />
                ) : (
                  <span className="h-6 w-6" />
                );
              })()}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{model.displayName}</span>
                <span className="font-mono text-[10px] text-muted-foreground/40">
                  {model.parameterCount}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="border px-1.5 py-0.5 text-[10px] text-muted-foreground">
                  {family}
                </span>
                <span className="text-[10px] text-muted-foreground/50">
                  ~{formatSize(model.estimatedSizeMB)}
                </span>
              </div>
              {/* relative size bar */}
              <div className="relative h-px w-full bg-secondary">
                <motion.div
                  className="absolute inset-y-0 left-0 bg-muted-foreground/40"
                  animate={inView ? { width: `${sizePct}%` } : { width: 0 }}
                  transition={{ duration: 0.6, ease: "easeOut", delay: inView ? 0.2 : 0 }}
                />
              </div>
              {/* expandable description */}
              <AnimatePresence initial={false}>
                {isOpen && description && (
                  <motion.div
                    key="desc"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="overflow-hidden"
                  >
                    <p className="pt-1 text-[11px] leading-relaxed text-muted-foreground/70">
                      {description}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </motion.div>
      <p className="text-xs text-muted-foreground/50">
        downloads once, cached locally · runs entirely on your gpu
      </p>
    </div>
  );
}

// ── Panel 2: Benchmark runner mockup ─────────────────────────────────────────
function RunPanel() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.3 });
  const [streamText, setStreamText] = useState("");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [transitioning, setTransitioning] = useState(false);

  const question = DEMO_QUESTIONS[questionIndex];

  useEffect(() => {
    if (!inView) {
      setStreamText("");
      return;
    }

    let charIndex = 0;
    const response = DEMO_QUESTIONS[questionIndex].response;

    const interval = setInterval(() => {
      charIndex++;
      if (charIndex <= response.length) {
        setStreamText(response.slice(0, charIndex));
      } else if (charIndex > response.length + 80) {
        // pause, then transition to next question
        clearInterval(interval);
        setTransitioning(true);
        setTimeout(() => {
          setQuestionIndex((prev) => (prev + 1) % DEMO_QUESTIONS.length);
          setStreamText("");
          setTransitioning(false);
        }, 300);
      }
    }, 18);

    return () => clearInterval(interval);
  }, [inView, questionIndex]);

  return (
    <div ref={ref} className="flex w-full flex-col gap-8">
      <div className="flex flex-col gap-3">
        <h3 className="text-2xl font-medium tracking-tight">run the suite</h3>
        <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
          multiple-choice questions from mmlu — cs, math, science, engineering. hard enough that even 8b models score under 60%. no ceiling.
        </p>
      </div>

      {/* progress bar */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>question {(questionIndex % 20) + 1} / 20</span>
          <span>{Math.floor(questionIndex * 0.6)} correct</span>
        </div>
        <div className="relative h-0.5 w-full bg-secondary">
          <div
            className="absolute inset-y-0 left-0 bg-foreground transition-[width] duration-300 ease-out"
            style={{ width: `${((questionIndex % 20) + 1) / 20 * 100}%` }}
          />
        </div>
      </div>

      {/* question card */}
      <div
        className="flex flex-col gap-4 border p-6 transition-opacity duration-300"
        style={{ opacity: transitioning ? 0 : 1 }}
      >
        <div className="flex items-center gap-2">
          <span className="border px-2 py-0.5 text-[11px] text-muted-foreground">
            {question.subject}
          </span>
          <span className="border px-2 py-0.5 text-[11px] text-muted-foreground">
            {question.difficulty}
          </span>
          <span className="ml-auto font-mono text-[10px] text-muted-foreground/40">
            {question.id}
          </span>
        </div>
        <p className="text-sm leading-relaxed text-foreground/70">
          {question.text}
        </p>
        {"choices" in question && question.choices && (
          <div className="flex flex-col gap-1 mt-1">
            {(question.choices as string[]).map((c, i) => (
              <span key={i} className="flex gap-2 text-xs text-muted-foreground">
                <span className="shrink-0 font-mono">{["A", "B", "C", "D"][i]}.</span>
                <span>{c}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* streaming output */}
      <div
        className="border-l-2 border-muted-foreground/20 pl-4 transition-opacity duration-300"
        style={{ opacity: transitioning ? 0 : 1 }}
      >
        <div className="mb-2 text-[11px] text-muted-foreground">model response</div>
        <div className="h-44 overflow-hidden">
          <pre className="whitespace-pre-wrap text-xs leading-relaxed text-muted-foreground/70">
            {streamText}
            <span className="animate-pulse">▋</span>
          </pre>
        </div>
      </div>
    </div>
  );
}

// ── Panel 3: Report mockup ────────────────────────────────────────────────────
const DIFFICULTY_DATA = [
  { label: "easy", pct: 82, correct: 14, total: 17 },
  { label: "medium", pct: 54, correct: 9, total: 17 },
  { label: "hard", pct: 21, correct: 3, total: 16 },
];

const SUBJECT_DATA = [
  { label: "cs", pct: 52 },
  { label: "engineering", pct: 44 },
  { label: "math", pct: 38 },
  { label: "science", pct: 49 },
];

function ReportPanel() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "0px 0px -80px 0px" });

  return (
    <div ref={ref} className="flex w-full flex-col gap-8">
      <div className="flex flex-col gap-3">
        <h3 className="text-2xl font-medium tracking-tight">get your report</h3>
        <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
          see exactly where your model fails — broken down by subject and difficulty. your speed goes on the hardware leaderboard. your accuracy goes on the model leaderboard.
        </p>
      </div>

      {/* difficulty blocks */}
      <div className="flex flex-col gap-3">
        <div className="text-xs text-muted-foreground">difficulty curve</div>
        <div className="flex gap-2">
          {DIFFICULTY_DATA.map((d, i) => (
            <motion.div
              key={d.label}
              animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
              transition={{ duration: 0.4, delay: inView ? i * 0.1 : 0, ease: "easeOut" }}
              className="flex flex-1 flex-col items-center gap-1.5 border p-5"
            >
              <span className="text-3xl font-medium tracking-tight">{d.pct}%</span>
              <span className="text-xs text-muted-foreground">{d.label}</span>
              <span className="text-[10px] text-muted-foreground/40">{d.correct}/{d.total}</span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* subject bars */}
      <div className="flex flex-col gap-3">
        <div className="text-xs text-muted-foreground">by subject</div>
        <div className="flex flex-col gap-3">
          {SUBJECT_DATA.map((s, i) => (
            <div key={s.label} className="flex items-center gap-4">
              <span className="w-20 shrink-0 text-sm text-muted-foreground">{s.label}</span>
              <div className="relative h-1 flex-1 bg-secondary">
                <motion.div
                  className="absolute inset-y-0 left-0 bg-foreground"
                  animate={inView ? { width: `${s.pct}%` } : { width: 0 }}
                  transition={{ duration: 0.8, delay: inView ? 0.3 + i * 0.1 : 0, ease: "easeOut" }}
                />
              </div>
              <span className="w-10 shrink-0 text-right text-sm text-muted-foreground/60">
                {s.pct}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function HowItWorks() {
  const panel1Ref = useRef<HTMLDivElement>(null);
  const panel2Ref = useRef<HTMLDivElement>(null);
  const panel3Ref = useRef<HTMLDivElement>(null);

  const p1Visible = useInView(panel1Ref, { margin: "0px 0px -100px 0px" });
  const p2Visible = useInView(panel2Ref, { margin: "0px 0px -100px 0px" });
  const p3Visible = useInView(panel3Ref, { margin: "0px 0px -100px 0px" });

  return (
    <section className="px-6">
      <div className="mx-auto max-w-4xl">
        <div
          ref={panel1Ref}
          className="flex min-h-[85vh] items-center border-b px-14 py-20"
        >
          <motion.div
            className="w-full"
            animate={p1Visible ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <ModelPanel />
          </motion.div>
        </div>

        <div
          ref={panel2Ref}
          className="flex min-h-[85vh] items-center border-b px-14 py-20"
        >
          <motion.div
            className="w-full"
            animate={p2Visible ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <RunPanel />
          </motion.div>
        </div>

        <div
          ref={panel3Ref}
          className="flex min-h-[85vh] items-center px-14 py-20"
        >
          <motion.div
            className="w-full"
            animate={p3Visible ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <ReportPanel />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
