"use client";

import { useRef, useState, useEffect } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { AVAILABLE_MODELS, modelLogo } from "@/lib/webllm/models";
import { EASE, DURATIONS, STAGGER_MS, ITEM_RISE_PX, ITEM_DURATION, BASE_DELAY } from "@/lib/motion";

// ── shared ────────────────────────────────────────────────────────────────────

const PANEL_VARIANTS = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: DURATIONS.slow, ease: EASE } },
};

// ── Panel 1: Model grid ───────────────────────────────────────────────────────

const cardContainer = {
  hidden: {},
  show: { transition: { staggerChildren: STAGGER_MS, delayChildren: BASE_DELAY } },
};

const cardItem = {
  hidden: { opacity: 0, y: ITEM_RISE_PX },
  show: { opacity: 1, y: 0, transition: { duration: ITEM_DURATION, ease: EASE } },
};

function formatSize(mb: number): string {
  return mb >= 1000 ? `${(mb / 1000).toFixed(1)}gb` : `${mb}mb`;
}

const MAX_MODEL_SIZE = 5000;

function ModelPanel() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "0px 0px -100px 0px" });

  return (
    <div ref={ref} className="flex w-full flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h3 className="font-serif text-xl font-medium tracking-tight">
          9 <span className="text-muted-foreground">quantized models</span>
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-md">
          0.6B to 8B parameters. Downloaded once, cached locally, and run entirely on your
          GPU via WebGPU — no API calls leave your device.
        </p>
      </div>

      <motion.div
        className="grid grid-cols-3 gap-1.5"
        variants={cardContainer}
        initial="hidden"
        animate={inView ? "show" : "hidden"}
      >
        {AVAILABLE_MODELS.map((model, idx) => {
          const sizePct = Math.round((model.estimatedSizeMB / MAX_MODEL_SIZE) * 100);
          const logo = modelLogo(model.id);
          return (
            <motion.div
              key={model.id}
              variants={cardItem}
              className="flex flex-col gap-3 border border-[--border] px-4 py-4"
            >
              {logo
                ? <img src={logo} alt="" className="h-5 w-5 object-contain" />
                : <span className="h-5 w-5" />
              }
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-medium">{model.displayName}</span>
                <span className="font-mono text-[10px] text-[--fg-subtle]">
                  {model.parameterCount} · ~{formatSize(model.estimatedSizeMB)}
                </span>
              </div>
              <div className="relative h-px w-full bg-[--border]">
                <motion.div
                  className="absolute inset-y-0 left-0 bg-muted-foreground/40"
                  animate={inView ? { width: `${sizePct}%` } : { width: 0 }}
                  transition={{ duration: 0.6, ease: "easeOut", delay: BASE_DELAY + 0.15 + idx * STAGGER_MS }}
                />
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}

// ── Panel 2: Run mockup ───────────────────────────────────────────────────────

const DEMO_QUESTIONS = [
  {
    subject: "cs",
    difficulty: "hard",
    text: "Which type of attack involves an attacker inserting themselves between two communicating parties?",
    choices: ["SQL injection", "Man-in-the-middle", "Cross-site scripting", "Buffer overflow"],
    response: `SQL injection targets databases via malicious queries.\nXSS injects scripts into web pages.\nBuffer overflow exploits memory.\n\nA man-in-the-middle attack intercepts communication between two parties.\n\nANSWER: B`,
  },
  {
    subject: "math",
    difficulty: "medium",
    text: "The function f(x) = x³ − 3x has a local maximum at x =",
    choices: ["x = 0", "x = 1", "x = −1", "x = 3"],
    response: `f'(x) = 3x² − 3 = 3(x−1)(x+1)\n\nCritical points: x = ±1\nf''(x) = 6x\nf''(−1) = −6 < 0 → local max\n\nANSWER: C`,
  },
  {
    subject: "science",
    difficulty: "hard",
    text: "A particle moves in a circle of radius r with constant speed v. The magnitude of its acceleration is:",
    choices: ["v/r", "v²/r", "v·r", "v²·r"],
    response: `Centripetal acceleration for uniform circular motion:\na = v²/r\n\nThis is the rate of change of the velocity vector's direction.\n\nANSWER: B`,
  },
];

function RunPanel() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.3 });
  const [streamText, setStreamText] = useState("");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [transitioning, setTransitioning] = useState(false);

  const question = DEMO_QUESTIONS[questionIndex];

  useEffect(() => {
    if (!inView) { setStreamText(""); return; }
    let charIndex = 0;
    const response = question.response;
    const interval = setInterval(() => {
      charIndex++;
      if (charIndex <= response.length) {
        setStreamText(response.slice(0, charIndex));
      } else if (charIndex > response.length + 60) {
        clearInterval(interval);
        setTransitioning(true);
        setTimeout(() => {
          setQuestionIndex((p) => (p + 1) % DEMO_QUESTIONS.length);
          setStreamText("");
          setTransitioning(false);
        }, 300);
      }
    }, 22);
    return () => clearInterval(interval);
  }, [inView, questionIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  const qNum = questionIndex + 1;

  return (
    <div ref={ref} className="flex w-full flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h3 className="font-serif text-xl font-medium tracking-tight">
          5-shot MMLU <span className="text-muted-foreground">evaluation</span>
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-md">
          The same 5-shot format used to benchmark frontier models — five solved
          examples precede every question, shown alongside published baselines for context.
        </p>
      </div>

      {/* methodology badge strip */}
      <div className="flex items-center gap-2 font-mono text-[10px] text-[--fg-subtle]">
        <span className="border border-[--border] px-2 py-0.5">Question {qNum} of 3</span>
        <span className="border border-[--border] px-2 py-0.5">{question.subject}</span>
        <span className="border border-[--border] px-2 py-0.5">{question.difficulty}</span>
        <span className="border border-[--border] px-2 py-0.5">5-shot</span>
        <span className="border border-[--border] px-2 py-0.5">temp=0.1</span>
      </div>

      {/* progress */}
      <div className="relative h-px w-full bg-[--border]">
        <motion.div
          className="absolute inset-y-0 left-0 bg-foreground"
          animate={{ width: `${(qNum / 3) * 100}%` }}
          transition={{ duration: 0.4, ease: EASE }}
        />
      </div>

      {/* question card */}
      <div
        className="border border-[--border] p-5 transition-opacity duration-300 flex flex-col gap-4"
        style={{ opacity: transitioning ? 0 : 1 }}
      >
        <p className="text-sm leading-relaxed text-foreground/80">{question.text}</p>
        <div className="flex flex-col gap-1">
          {question.choices.map((c, i) => (
            <span key={i} className="flex gap-2 text-xs text-muted-foreground">
              <span className="shrink-0 font-mono">{["A", "B", "C", "D"][i]}.</span>
              <span>{c}</span>
            </span>
          ))}
        </div>
      </div>

      {/* streaming output */}
      <div
        className="border-l border-[--border] pl-4 transition-opacity duration-300"
        style={{ opacity: transitioning ? 0 : 1 }}
      >
        <div className="mb-2 font-mono text-[10px] text-[--fg-subtle]">reasoning</div>
        <div className="h-32 overflow-hidden">
          <pre className="whitespace-pre-wrap text-xs leading-relaxed text-muted-foreground/70">
            {streamText}
            <span className="opacity-60">▋</span>
          </pre>
        </div>
      </div>
    </div>
  );
}

// ── Panel 3: Report mockup ────────────────────────────────────────────────────

const BEHAVIOR_METRICS = [
  { label: "accuracy",   value: "67%",        note: "±28% · n=3 · 95% Wilson CI" },
  { label: "correct",    value: "2 / 3",      note: "questions answered correctly" },
  { label: "extracted",  value: "3 / 3",      note: "answers parsed from raw output" },
  { label: "subject",    value: "cs · math",  note: "topics sampled this run" },
];

function AnimatedScore({ inView }: { inView: boolean }) {
  const [display, setDisplay] = useState(0);
  const target = 67;

  useEffect(() => {
    if (!inView) { setDisplay(0); return; }
    let start: number | null = null;
    const duration = 800;
    function step(ts: number) {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    }
    const raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [inView]);

  return <>{display}</>;
}

function ReportPanel() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "0px 0px -80px 0px" });

  return (
    <div ref={ref} className="flex w-full flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h3 className="font-serif text-xl font-medium tracking-tight">
          Honest <span className="text-muted-foreground">report</span>
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-md">
          Accuracy with a 95% Wilson confidence interval, and the full raw output
          of every question. No polish on top of weak models — you see what they
          actually wrote, including the spirals and the hedges.
        </p>
      </div>

      <motion.div
        className="flex flex-col gap-6"
        animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
        transition={{ duration: DURATIONS.base, ease: EASE }}
      >
        {/* accuracy hero */}
        <div className="flex flex-col gap-1">
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-5xl font-medium tabular-nums">
              <AnimatedScore inView={inView} />
            </span>
            <span className="text-xl text-[--fg-subtle]">%</span>
            <span className="ml-2 text-sm text-muted-foreground">accuracy</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              raw model output captured for every question · five-tier answer extraction
            </span>
          </div>
        </div>

        {/* published reference */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono border-t border-[--border] pt-4">
          <span>published reference: 58.2%</span>
          <span className="text-[--fg-subtle]">·</span>
          <span className="text-[--success]">your run agrees within CI ✓</span>
        </div>

        {/* metric rows */}
        <div className="flex flex-col border-t border-[--border] pt-4">
          {BEHAVIOR_METRICS.map((m, i) => (
            <motion.div
              key={m.label}
              className="flex items-baseline gap-4 py-2.5 border-b border-[--border]"
              animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: -8 }}
              transition={{ duration: DURATIONS.base, ease: EASE, delay: inView ? 0.1 + i * 0.05 : 0 }}
            >
              <span className="w-24 shrink-0 text-xs text-muted-foreground">{m.label}</span>
              <span className="font-mono text-sm font-medium tabular-nums">{m.value}</span>
              <span className="text-[10px] text-[--fg-subtle]">{m.note}</span>
            </motion.div>
          ))}
        </div>

        {/* methodology footer */}
        <div className="flex items-center gap-2 text-[10px] text-[--fg-subtle] font-mono">
          <span>5-shot MMLU</span>
          <span>·</span>
          <span>Wilson 95% CI</span>
          <span>·</span>
          <span>layered answer extraction</span>
          <span>·</span>
          <span>WebGPU inference</span>
        </div>
      </motion.div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

function PanelWrapper({ children, last }: { children: React.ReactNode; last?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "0px 0px -100px 0px" });

  return (
    <div
      ref={ref}
      className={`flex min-h-[80vh] items-center py-20 ${last ? "" : "border-b border-[--border]"}`}
    >
      <AnimatePresence>
        <motion.div
          className="w-full"
          variants={PANEL_VARIANTS}
          initial="hidden"
          animate={inView ? "show" : "hidden"}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export function HowItWorks() {
  return (
    <section className="px-8">
      <div className="mx-auto max-w-2xl">
        <PanelWrapper>
          <ModelPanel />
        </PanelWrapper>
        <PanelWrapper>
          <RunPanel />
        </PanelWrapper>
        <PanelWrapper last>
          <ReportPanel />
        </PanelWrapper>
      </div>
    </section>
  );
}
