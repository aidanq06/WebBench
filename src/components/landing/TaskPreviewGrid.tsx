"use client";

import { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion, animate, useMotionValue, useTransform } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { QUESTIONS } from "@/lib/benchmark/questions";
import { QuestionText } from "@/components/benchmark/QuestionText";
import type { Subject, Difficulty } from "@/types/agent";

// ── Constants ─────────────────────────────────────────────────────────────────

const SUBJECTS: Subject[] = ["cs", "engineering", "math", "science"];
const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];
const PAGE_SIZE = 15;

const SUBJECT_DOT: Record<Subject, string> = {
  cs:          "bg-blue-500",
  engineering: "bg-orange-500",
  math:        "bg-emerald-500",
  science:     "bg-purple-500",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function plainPreview(text: string): string {
  return text
    .replace(/\$\$[^$]+\$\$/g, "…")
    .replace(/\$[^$\n]+\$/g, (m) =>
      m.slice(1, -1).replace(/\\[a-zA-Z]+\*?/g, "").replace(/[{}^_]/g, "")
    )
    .replace(/```[\s\S]*?```/g, "[code]")
    .replace(/`[^`]+`/g, (m) => m.slice(1, -1))
    .replace(/\n/g, " ")
    .trim()
    .slice(0, 220);
}

// ── Stagger helper ────────────────────────────────────────────────────────────

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, delay, ease: "easeOut" as const },
});

// ── Spinning digit odometer ───────────────────────────────────────────────────

const DIGIT_H = 1.875; // rem — matches text-3xl font-size with leading-none
// 250-element strip gives room for ~20 forward-spinning animations per digit column
const STRIP = Array.from({ length: 250 }, (_, i) => i % 10);
const SPIN_START = 50; // start mid-strip so there's room to spin

function SpinningDigit({ digit }: { digit: number }) {
  const slotPos = useMotionValue(SPIN_START + digit);
  const prevRef = useRef(digit);

  useEffect(() => {
    if (digit === prevRef.current) return;
    const current = slotPos.get();
    const currentDigit = Math.round(current) % 10;
    const steps = (digit - currentDigit + 10) % 10;
    prevRef.current = digit;
    if (steps === 0) return;
    const controls = animate(slotPos, current + steps, {
      duration: 0.45,
      ease: [0.16, 1, 0.3, 1],
    });
    return () => controls.stop();
  }, [digit]);

  const y = useTransform(slotPos, (v) => `${-v * DIGIT_H}rem`);

  return (
    <div className="overflow-hidden" style={{ height: `${DIGIT_H}rem` }}>
      <motion.div className="flex flex-col" style={{ y }}>
        {STRIP.map((d, i) => (
          <div
            key={i}
            className="select-none font-semibold leading-none"
            style={{ height: `${DIGIT_H}rem`, fontSize: `${DIGIT_H}rem` }}
          >
            {d}
          </div>
        ))}
      </motion.div>
    </div>
  );
}

function SpinningNumber({ value }: { value: number }) {
  const digits = String(value).split("").map(Number);
  return (
    <div className="flex tabular-nums">
      <AnimatePresence mode="popLayout">
        {digits.map((d, i) => {
          const posFromRight = digits.length - 1 - i;
          return (
            <motion.div
              key={posFromRight}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <SpinningDigit digit={d} />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

// ── Stage 1: Configurator ─────────────────────────────────────────────────────

function Configurator({
  activeSubject,
  activeDifficulty,
  matchCount,
  onSubject,
  onDifficulty,
  onBrowse,
}: {
  activeSubject: Subject | "all";
  activeDifficulty: Difficulty | "all";
  matchCount: number;
  onSubject: (s: Subject | "all") => void;
  onDifficulty: (d: Difficulty | "all") => void;
  onBrowse: () => void;
}) {

  return (
    <div className="flex flex-col gap-10">
      {/* heading */}
      <motion.div {...fadeUp(0)} className="flex flex-col gap-1">
        <h1 className="text-2xl font-medium tracking-tight">question bank</h1>
        <p className="text-sm text-muted-foreground/50">
          {QUESTIONS.length} questions · mmlu
        </p>
      </motion.div>

      {/* subject */}
      <motion.div {...fadeUp(0.12)} className="flex flex-col gap-3">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground/30">subject</p>
        <div className="flex flex-wrap items-center gap-0 text-sm">
          {(["all", ...SUBJECTS] as (Subject | "all")[]).map((s, i) => (
            <span key={s} className="flex items-center">
              {i > 0 && <span className="mx-2 text-muted-foreground/15"> · </span>}
              <button
                onClick={() => onSubject(s)}
                className={`transition-colors duration-150 ${
                  activeSubject === s
                    ? "font-medium text-foreground"
                    : "text-muted-foreground/35 hover:text-muted-foreground"
                }`}
              >
                {s}
              </button>
            </span>
          ))}
        </div>
      </motion.div>

      {/* difficulty */}
      <motion.div {...fadeUp(0.20)} className="flex flex-col gap-3">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground/30">difficulty</p>
        <div className="flex flex-wrap items-center gap-0 text-sm">
          {(["all", ...DIFFICULTIES] as (Difficulty | "all")[]).map((d, i) => (
            <span key={d} className="flex items-center">
              {i > 0 && <span className="mx-2 text-muted-foreground/15"> · </span>}
              <button
                onClick={() => onDifficulty(d)}
                className={`transition-colors duration-150 ${
                  activeDifficulty === d
                    ? "font-medium text-foreground"
                    : "text-muted-foreground/35 hover:text-muted-foreground"
                }`}
              >
                {d}
              </button>
            </span>
          ))}
        </div>
      </motion.div>

      {/* count + browse */}
      <motion.div {...fadeUp(0.28)} className="flex flex-col gap-5">
        <div className="flex items-baseline gap-2">
          <SpinningNumber value={matchCount} />
          <motion.span
            layout
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="text-sm text-muted-foreground/50"
          >
            questions match
          </motion.span>
        </div>

        <motion.button
          onClick={onBrowse}
          whileTap={{ scale: 0.98 }}
          className="w-full border py-4 text-sm transition-colors hover:bg-accent/20"
        >
          browse →
        </motion.button>
      </motion.div>
    </div>
  );
}

// ── Stage 2: Browse ───────────────────────────────────────────────────────────

function Browse({
  activeSubject,
  activeDifficulty,
  matchCount,
  onBack,
}: {
  activeSubject: Subject | "all";
  activeDifficulty: Difficulty | "all";
  matchCount: number;
  onBack: () => void;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [page, setPage] = useState(0);

  const filtered = QUESTIONS.filter((q) => {
    const ms = activeSubject === "all" || q.subject === activeSubject;
    const md = activeDifficulty === "all" || q.difficulty === activeDifficulty;
    return ms && md;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const filterLabel = [
    activeSubject !== "all" ? activeSubject : null,
    activeDifficulty !== "all" ? activeDifficulty : null,
  ]
    .filter(Boolean)
    .join(" · ") || "all questions";

  return (
    <div className="flex flex-col gap-8">
      {/* header row */}
      <div className="flex items-center justify-between">
        <motion.button
          onClick={onBack}
          whileHover={{ x: -2 }}
          transition={{ duration: 0.15 }}
          className="text-sm text-muted-foreground/40 transition-colors hover:text-muted-foreground"
        >
          ← back
        </motion.button>
        <span className="text-xs text-muted-foreground/35">
          {filterLabel} · {matchCount} questions
        </span>
      </div>

      {/* question rows */}
      <motion.div
        key={page}
        className="divide-y divide-border/20"
      >
        {paginated.map((q, i) => {
          const isOpen = openId === q.id;
          return (
            <motion.div
              key={q.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: i * 0.03, ease: "easeOut" }}
            >
              <button
                className="flex w-full items-start gap-3 px-1 py-3 text-left transition-colors hover:bg-accent/10"
                onClick={() => setOpenId(isOpen ? null : q.id)}
              >
                <span className={`mt-1 shrink-0 h-[5px] w-[5px] rounded-full ${SUBJECT_DOT[q.subject]}`} />
                <span className="flex-1 line-clamp-2 text-sm text-muted-foreground">
                  {plainPreview(q.text)}
                </span>
                <span className="mt-0.5 shrink-0 text-xs text-muted-foreground/35">{q.difficulty}</span>
                <span className="mt-0.5 shrink-0 font-mono text-[10px] text-muted-foreground/20">{q.id}</span>
                <motion.span
                  animate={{ rotate: isOpen ? 90 : 0 }}
                  transition={{ duration: 0.18 }}
                  className="shrink-0 text-muted-foreground/30"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </motion.span>
              </button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    key="shell"
                    initial={{ height: 0 }}
                    animate={{ height: "auto" }}
                    exit={{ height: 0 }}
                    transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
                    className="overflow-hidden"
                  >
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.22, delay: 0.14, ease: "easeOut" }}
                      className="ml-4 border-l-2 border-border/30 pl-5 py-5"
                    >
                      <QuestionText text={q.text} choices={q.choices} highlightCorrect={q.expectedAnswer} />
                      <p className="mt-4 font-mono text-xs text-muted-foreground/40">
                        answer: {q.expectedAnswer}
                      </p>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </motion.div>

      {/* pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground/35">
          <button
            onClick={() => { setPage((p) => p - 1); setOpenId(null); }}
            disabled={page === 0}
            className="transition-colors hover:text-muted-foreground disabled:opacity-20 disabled:cursor-not-allowed"
          >
            ← prev
          </button>
          <span className="tabular-nums">{page + 1} / {totalPages}</span>
          <button
            onClick={() => { setPage((p) => p + 1); setOpenId(null); }}
            disabled={page >= totalPages - 1}
            className="transition-colors hover:text-muted-foreground disabled:opacity-20 disabled:cursor-not-allowed"
          >
            next →
          </button>
        </div>
      )}
    </div>
  );
}

// ── Root component ────────────────────────────────────────────────────────────

type Stage = "configure" | "browse";

export function TaskPreviewGrid() {
  const [stage, setStage] = useState<Stage>("configure");
  const [goingBack, setGoingBack] = useState(false);
  const [activeSubject, setActiveSubject] = useState<Subject | "all">("all");
  const [activeDifficulty, setActiveDifficulty] = useState<Difficulty | "all">("all");

  const matchCount = QUESTIONS.filter((q) => {
    const ms = activeSubject === "all" || q.subject === activeSubject;
    const md = activeDifficulty === "all" || q.difficulty === activeDifficulty;
    return ms && md;
  }).length;

  function enterBrowse() {
    setGoingBack(false);
    setStage("browse");
  }

  function goBack() {
    setGoingBack(true);
    setStage("configure");
  }

  // forward:  configure exits y:-12, browse enters y:12
  // backward: browse exits y:12, configure enters y:-12
  const variants = {
    enter: (back: boolean) => ({ opacity: 0, y: back ? -12 : 12 }),
    center: { opacity: 1, y: 0 },
    exit: (back: boolean) => ({ opacity: 0, y: back ? 12 : -12 }),
  };

  return (
    <section className="px-6 py-16">
      <div className="mx-auto max-w-2xl">
        <AnimatePresence mode="wait" custom={goingBack}>
          {stage === "configure" ? (
            <motion.div
              key="configure"
              custom={goingBack}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="mx-auto max-w-sm"
            >
              <Configurator
                activeSubject={activeSubject}
                activeDifficulty={activeDifficulty}
                matchCount={matchCount}
                onSubject={setActiveSubject}
                onDifficulty={setActiveDifficulty}
                onBrowse={enterBrowse}
              />
            </motion.div>
          ) : (
            <motion.div
              key="browse"
              custom={goingBack}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.22, ease: "easeOut" }}
            >
              <Browse
                activeSubject={activeSubject}
                activeDifficulty={activeDifficulty}
                matchCount={matchCount}
                onBack={goBack}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
