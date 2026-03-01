"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { AVAILABLE_MODELS } from "@/lib/webllm/models";

// ── Demo questions for panel 2 ───────────────────────────────────────────────
const DEMO_QUESTIONS = [
  {
    subject: "math",
    difficulty: "medium",
    id: "math-012",
    text: "What is the sum of the first 50 positive integers? Is it divisible by 3?",
    response: `Let me work through this step by step.\n\nFirst, I need to find the sum of the first 50 positive integers.\nUsing the formula n(n+1)/2 = 50×51/2 = 1275.\n\nNow checking divisibility: 1275 / 3 = 425. Yes, divisible.\n\nANSWER: 1275`,
  },
  {
    subject: "logic",
    difficulty: "hard",
    id: "logic-008",
    text: "If all Bloops are Razzies and all Razzies are Lazzies, are all Bloops definitely Lazzies?",
    response: `This is a classic syllogism.\n\nPremise 1: All Bloops are Razzies.\nPremise 2: All Razzies are Lazzies.\n\nBy transitivity: if every Bloop is a Razzy, and every Razzy is a Lazzy, then every Bloop must be a Lazzy.\n\nANSWER: Yes`,
  },
  {
    subject: "coding",
    difficulty: "medium",
    id: "code-015",
    text: "What is the time complexity of binary search on a sorted array of n elements?",
    response: `Binary search works by repeatedly halving the search space.\n\nAt each step, we compare the target to the middle element and eliminate half the remaining elements.\n\nAfter k steps: n / 2^k = 1, so k = log₂(n).\n\nANSWER: O(log n)`,
  },
  {
    subject: "reasoning",
    difficulty: "hard",
    id: "reas-003",
    text: "A bat and a ball cost $1.10 together. The bat costs $1.00 more than the ball. How much does the ball cost?",
    response: `The intuitive answer is $0.10, but let me check.\n\nIf ball = $0.10, then bat = $1.10. Total = $1.20. That's wrong.\n\nLet ball = x. Then bat = x + $1.00.\nx + (x + $1.00) = $1.10\n2x = $0.10\nx = $0.05\n\nANSWER: $0.05`,
  },
  {
    subject: "math",
    difficulty: "hard",
    id: "math-027",
    text: "What is the derivative of f(x) = x³ · ln(x)?",
    response: `Using the product rule: d/dx[u·v] = u'v + uv'\n\nLet u = x³, so u' = 3x²\nLet v = ln(x), so v' = 1/x\n\nf'(x) = 3x² · ln(x) + x³ · (1/x)\nf'(x) = 3x² ln(x) + x²\nf'(x) = x²(3 ln(x) + 1)\n\nANSWER: x²(3ln(x) + 1)`,
  },
  {
    subject: "logic",
    difficulty: "easy",
    id: "logic-001",
    text: "If it takes 5 machines 5 minutes to make 5 widgets, how long would it take 100 machines to make 100 widgets?",
    response: `Each machine makes 1 widget in 5 minutes.\n\nWith 100 machines working in parallel, each one makes 1 widget.\n100 machines × 1 widget each = 100 widgets.\n\nTime = 5 minutes (same as before, just more machines working simultaneously).\n\nANSWER: 5 minutes`,
  },
  {
    subject: "coding",
    difficulty: "hard",
    id: "code-022",
    text: "What does a stack overflow error typically indicate in a recursive function?",
    response: `A stack overflow occurs when the call stack exceeds its maximum size.\n\nIn recursive functions, this typically means:\n1. Missing or incorrect base case\n2. The recursion doesn't converge toward the base case\n3. Input is too large for the available stack depth\n\nEach recursive call adds a frame to the stack until memory is exhausted.\n\nANSWER: infinite or excessively deep recursion`,
  },
  {
    subject: "reasoning",
    difficulty: "medium",
    id: "reas-011",
    text: "You have 8 identical-looking balls. One is heavier. Using a balance scale, what is the minimum number of weighings to find it?",
    response: `Split 8 balls into groups of 3, 3, and 2.\n\nWeighing 1: Compare the two groups of 3.\n- If equal: heavy ball is in the group of 2. One more weighing finds it.\n- If unequal: heavy ball is in the heavier group of 3.\n\nWeighing 2: From the group of 3, compare any 2 balls.\n- If equal: the third ball is heavy.\n- If unequal: the heavier one is it.\n\nANSWER: 2`,
  },
  {
    subject: "math",
    difficulty: "easy",
    id: "math-003",
    text: "What is 17 × 23 without a calculator?",
    response: `I'll break this down:\n17 × 23 = 17 × 20 + 17 × 3\n17 × 20 = 340\n17 × 3 = 51\n340 + 51 = 391\n\nANSWER: 391`,
  },
  {
    subject: "coding",
    difficulty: "easy",
    id: "code-004",
    text: "In a zero-indexed array of length 10, what is the index of the last element?",
    response: `In zero-indexed arrays:\n- First element: index 0\n- Second element: index 1\n- ...\n- Last element: index (length - 1)\n\nFor length 10: last index = 10 - 1 = 9\n\nANSWER: 9`,
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
  return "other";
}

const MAX_MODEL_SIZE = 4900; // qwen 3 8b

const MODEL_INFO: Record<string, string> = {
  "qwen 3 0.6b": "Alibaba's smallest Qwen3 model. Hybrid reasoning with thinking/non-thinking modes. Punches above its weight for basic Q&A and simple math.",
  "llama 3.2 1b": "Meta's compact edge model. Optimized for on-device tasks. Struggles with multi-step reasoning but fast and lightweight.",
  "qwen 2.5 1.5b": "Previous-gen Qwen with strong coding and math relative to its size. Good baseline for 1–2B comparisons.",
  "qwen 3 1.7b": "Latest Qwen3 at 1.7B. Hybrid reasoning mode. Noticeably sharper than 1.5b Qwen2.5 on logic tasks.",
  "gemma 2 2b": "Google DeepMind's Gemma 2. Uses novel interleaved local/global attention. Competitive with models twice its size on some benchmarks.",
  "llama 3.2 3b": "Meta's instruction-tuned 3B. Well-rounded across categories. Good mid-range reference point for the benchmark.",
  "qwen 3 4b": "Qwen3 4B with extended chain-of-thought support. Strong multilingual reasoning. Often closes the gap with 7B models.",
  "qwen 2.5 7b": "Qwen2.5's flagship 7B. Trained on 18T tokens with emphasis on math and code. Solid upper-mid performer.",
  "qwen 3 8b": "Largest model in the suite. Qwen3 8B with full reasoning capabilities. Sets the ceiling for in-browser performance.",
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
          9 models from 0.6b to 8b parameters, all running locally in your browser via webgpu. no api keys. no server.
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
          20 questions across math, logic, coding, and reasoning. each question tests multi-step reasoning — the key discriminator between model sizes.
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
  { label: "math", pct: 60 },
  { label: "logic", pct: 75 },
  { label: "coding", pct: 45 },
  { label: "reasoning", pct: 70 },
];

function ReportPanel() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "0px 0px -80px 0px" });

  return (
    <div ref={ref} className="flex w-full flex-col gap-8">
      <div className="flex flex-col gap-3">
        <h3 className="text-2xl font-medium tracking-tight">get your report</h3>
        <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
          accuracy by difficulty is the clearest signal. small models collapse on hard questions; larger ones hold up. subject breakdown shows where capability drops off.
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

// ── Step nav item ─────────────────────────────────────────────────────────────
const STEPS = [
  { num: "01", label: "select" },
  { num: "02", label: "run" },
  { num: "03", label: "report" },
];

// ── Main component ────────────────────────────────────────────────────────────
export function HowItWorks() {
  const sectionRef = useRef<HTMLElement>(null);
  const panel1Ref = useRef<HTMLDivElement>(null);
  const panel2Ref = useRef<HTMLDivElement>(null);
  const panel3Ref = useRef<HTMLDivElement>(null);
  const [activeStep, setActiveStep] = useState(0);

  const p1Visible = useInView(panel1Ref, { margin: "0px 0px -100px 0px" });
  const p2Visible = useInView(panel2Ref, { margin: "0px 0px -100px 0px" });
  const p3Visible = useInView(panel3Ref, { margin: "0px 0px -100px 0px" });

  const updateActiveStep = useCallback(() => {
    const panels = [panel1Ref.current, panel2Ref.current, panel3Ref.current];
    const viewportCenter = window.innerHeight / 2;

    let closest = 0;
    let closestDist = Infinity;

    for (let i = 0; i < panels.length; i++) {
      const el = panels[i];
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      const panelCenter = rect.top + rect.height / 2;
      const dist = Math.abs(panelCenter - viewportCenter);
      if (dist < closestDist) {
        closestDist = dist;
        closest = i;
      }
    }

    setActiveStep(closest);
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", updateActiveStep, { passive: true });
    return () => window.removeEventListener("scroll", updateActiveStep);
  }, [updateActiveStep]);

  const headingRef = useRef<HTMLDivElement>(null);
  const headingVisible = useInView(headingRef, { once: true, margin: "0px 0px -50px 0px" });
  const navVisible = useInView(panel1Ref, { margin: "0px 0px -200px 0px" });

  return (
    <section ref={sectionRef} className="px-6">
      <div className="mx-auto max-w-7xl">
        <motion.div
          ref={headingRef}
          className="py-10"
          initial={{ opacity: 0, y: 12 }}
          animate={headingVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <h2 className="text-xs text-muted-foreground">how it works</h2>
        </motion.div>

        <div className="flex">
          {/* sticky left nav */}
          <div className="hidden w-[260px] shrink-0 sm:block">
            <div className="sticky top-24 flex flex-col gap-6 pb-24">
              {STEPS.map((step, i) => (
                <motion.div
                  key={step.num}
                  className="flex items-baseline gap-3"
                  initial={{ opacity: 0, x: -8 }}
                  animate={navVisible ? { opacity: activeStep === i ? 1 : 0.2, x: 0 } : {}}
                  transition={{
                    opacity: { duration: 0.3 },
                    x: { duration: 0.4, delay: i * 0.08, ease: "easeOut" },
                  }}
                >
                  <span className="font-mono text-xs text-muted-foreground">{step.num}</span>
                  <span className="text-sm font-medium">{step.label}</span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* right panels */}
          <div className="flex-1 sm:border-l">
            <div
              ref={panel1Ref}
              className="flex min-h-[85vh] items-center border-b px-8 py-20 sm:px-14"
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
              className="flex min-h-[85vh] items-center border-b px-8 py-20 sm:px-14"
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
              className="flex min-h-[85vh] items-center px-8 py-20 sm:px-14"
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
        </div>
      </div>
    </section>
  );
}
