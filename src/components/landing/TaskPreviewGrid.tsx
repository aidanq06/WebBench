"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { QUESTIONS } from "@/lib/benchmark/questions";
import { QuestionText } from "@/components/benchmark/QuestionText";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { EASE } from "@/lib/motion";
import type { Subject, Difficulty } from "@/types/agent";

// ── Constants ─────────────────────────────────────────────────────────────────

const SUBJECTS: Subject[] = ["cs", "engineering", "math", "science"];
const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];
const PAGE_SIZE = 15;

const SUBJECT_DOT: Record<Subject, string> = {
  cs:          "bg-blue-500/70",
  engineering: "bg-orange-500/70",
  math:        "bg-emerald-500/70",
  science:     "bg-purple-500/70",
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

// ── Filter button row ─────────────────────────────────────────────────────────

function FilterRow<T extends string>({
  label,
  options,
  active,
  onSelect,
}: {
  label: string;
  options: T[];
  active: T;
  onSelect: (v: T) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <p className="font-mono text-[10px] uppercase tracking-widest text-[--fg-subtle]">{label}</p>
      <div className="flex flex-wrap items-center gap-0 text-sm">
        {options.map((opt, i) => (
          <span key={opt} className="flex items-center">
            {i > 0 && <span className="mx-2 text-muted-foreground/15"> · </span>}
            <button
              onClick={() => onSelect(opt)}
              className={`transition-colors duration-150 ${
                active === opt
                  ? "font-medium text-foreground"
                  : "text-muted-foreground/35 hover:text-muted-foreground"
              }`}
            >
              {opt}
            </button>
          </span>
        ))}
      </div>
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
      <FilterRow
        label="subject"
        options={["all", ...SUBJECTS] as (Subject | "all")[]}
        active={activeSubject}
        onSelect={onSubject}
      />

      <FilterRow
        label="difficulty"
        options={["all", ...DIFFICULTIES] as (Difficulty | "all")[]}
        active={activeDifficulty}
        onSelect={onDifficulty}
      />

      <div className="flex flex-col gap-5">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-medium tabular-nums">
            <AnimatedNumber value={matchCount} duration={0.25} />
          </span>
          <span className="text-sm text-muted-foreground/50">questions match</span>
        </div>

        <motion.button
          onClick={onBrowse}
          whileTap={{ scale: 0.99 }}
          className="w-full border py-4 text-sm transition-colors hover:bg-foreground/[0.03]"
        >
          browse →
        </motion.button>
      </div>
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
        <button
          onClick={onBack}
          className="text-xs text-[--fg-subtle] transition-colors hover:text-muted-foreground"
        >
          ← back
        </button>
        <span className="font-mono text-[10px] text-[--fg-subtle]">
          {filterLabel} · {matchCount}
        </span>
      </div>

      {/* question rows */}
      <motion.div key={page} className="flex flex-col divide-y divide-[--border]">
        {paginated.map((q) => {
          const isOpen = openId === q.id;
          return (
            <div key={q.id}>
              <button
                className="flex w-full items-start gap-3 py-3 text-left transition-colors hover:bg-foreground/[0.02]"
                onClick={() => setOpenId(isOpen ? null : q.id)}
              >
                <span
                  className={`mt-[7px] shrink-0 h-[5px] w-[5px] rounded-full ${SUBJECT_DOT[q.subject]}`}
                />
                <span className="flex-1 line-clamp-2 text-sm text-muted-foreground">
                  {plainPreview(q.text)}
                </span>
                <span className="mt-0.5 shrink-0 font-mono text-[10px] text-[--fg-subtle]">
                  {q.difficulty}
                </span>
                <motion.span
                  animate={{ rotate: isOpen ? 90 : 0 }}
                  transition={{ duration: 0.18 }}
                  className="mt-0.5 shrink-0 font-mono text-[10px] text-[--fg-subtle]"
                >
                  ›
                </motion.span>
              </button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    key="shell"
                    initial={{ height: 0 }}
                    animate={{ height: "auto" }}
                    exit={{ height: 0 }}
                    transition={{ duration: 0.22, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2, delay: 0.1, ease: EASE }}
                      className="border-l border-[--border] ml-4 pl-5 py-5"
                    >
                      <QuestionText
                        text={q.text}
                        choices={q.choices}
                        highlightCorrect={q.expectedAnswer}
                      />
                      <p className="mt-4 font-mono text-[10px] text-[--fg-subtle]">
                        answer: {q.expectedAnswer}
                      </p>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </motion.div>

      {/* pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between font-mono text-xs text-[--fg-subtle]">
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

const slideVariants = {
  enter: (back: boolean) => ({ opacity: 0, y: back ? -12 : 12 }),
  center: { opacity: 1, y: 0 },
  exit: (back: boolean) => ({ opacity: 0, y: back ? 12 : -12 }),
};

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

  return (
    <AnimatePresence mode="wait" custom={goingBack}>
      {stage === "configure" ? (
        <motion.div
          key="configure"
          custom={goingBack}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.22, ease: "easeOut" }}
        >
          <Configurator
            activeSubject={activeSubject}
            activeDifficulty={activeDifficulty}
            matchCount={matchCount}
            onSubject={setActiveSubject}
            onDifficulty={setActiveDifficulty}
            onBrowse={() => { setGoingBack(false); setStage("browse"); }}
          />
        </motion.div>
      ) : (
        <motion.div
          key="browse"
          custom={goingBack}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.22, ease: "easeOut" }}
        >
          <Browse
            activeSubject={activeSubject}
            activeDifficulty={activeDifficulty}
            matchCount={matchCount}
            onBack={() => { setGoingBack(true); setStage("configure"); }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
