"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { EASE } from "@/lib/motion";

const heroContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.18, delayChildren: 0.1 } },
};
const heroItem = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.9, ease: EASE } },
};

const PHRASES = ["server.", "API key.", "sign-up."];
const TYPE_MS = 55;
const DELETE_MS = 45;
const HOLD_MS = 1800;
const GAP_MS = 250;

function TypingRotator() {
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [text, setText] = useState("");
  const [phase, setPhase] = useState<"typing" | "holding" | "deleting" | "gap">("typing");

  useEffect(() => {
    const current = PHRASES[phraseIdx];
    let t: ReturnType<typeof setTimeout>;
    if (phase === "typing") {
      if (text.length < current.length) {
        t = setTimeout(
          () => setText(current.slice(0, text.length + 1)),
          TYPE_MS + (Math.random() * 30 - 15),
        );
      } else {
        t = setTimeout(() => setPhase("holding"), 0);
      }
    } else if (phase === "holding") {
      t = setTimeout(() => setPhase("deleting"), HOLD_MS);
    } else if (phase === "deleting") {
      if (text.length > 2) {
        t = setTimeout(
          () => setText(text.slice(0, -1)),
          DELETE_MS + (Math.random() * 20 - 10),
        );
      } else if (text.length > 0) {
        t = setTimeout(() => setText(""), DELETE_MS);
      } else {
        t = setTimeout(() => setPhase("gap"), 0);
      }
    } else {
      t = setTimeout(() => {
        setPhraseIdx((i) => (i + 1) % PHRASES.length);
        setPhase("typing");
      }, GAP_MS);
    }
    return () => clearTimeout(t);
  }, [text, phase, phraseIdx]);

  const isIdle = phase === "holding" || phase === "gap";

  return (
    <span
      className="text-foreground"
      aria-label="no server, no API key, no sign-up"
    >
      no {text}
      <span
        aria-hidden
        className={`ml-[2px] inline-block h-[0.95em] w-[1.5px] -translate-y-[1px] bg-foreground align-middle transition-opacity duration-150 ${
          isIdle ? "animate-cursor-blink" : ""
        }`}
      />
    </span>
  );
}

export function HeroSection() {
  const { scrollY } = useScroll();
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);
  const y = useTransform(scrollY, [0, 300], [0, -24]);

  return (
    <section className="relative flex min-h-[calc(80dvh-3rem)] items-center px-8">
      <motion.div
        className="mx-auto w-full max-w-2xl flex flex-col gap-6"
        style={{ opacity, y }}
        variants={heroContainer}
        initial="hidden"
        animate="show"
      >
        {/* headline */}
        <motion.h1
          variants={heroItem}
          className="font-serif text-5xl font-medium tracking-tight leading-tight"
        >
          A real LLM benchmark,{" "}
          <span className="text-muted-foreground">running entirely in your browser.</span>
        </motion.h1>

        {/* sub-copy */}
        <motion.p
          variants={heroItem}
          className="text-sm text-[--fg-subtle] leading-relaxed max-w-md"
        >
          We download a quantized LLM to your browser. Your GPU runs it via WebGPU.
          We score it on multiple-choice accuracy and show you exactly what it wrote —{" "}
          <TypingRotator />
        </motion.p>

        {/* CTA row */}
        <motion.div variants={heroItem} className="flex items-center gap-4">
          <Link
            href="/benchmark"
            className="border border-foreground bg-foreground px-8 py-3 text-sm text-background transition-colors hover:bg-foreground/90"
          >
            run benchmark
          </Link>
          <Link
            href="/results"
            className="border border-[--border] px-8 py-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            browse results
          </Link>
          <Link
            href="/benchmark?demo=true"
            className="text-sm text-[--fg-subtle] transition-colors hover:text-muted-foreground"
          >
            demo run →
          </Link>
        </motion.div>
      </motion.div>

      {/* scroll hint */}
      <motion.div
        className="absolute bottom-10 left-1/2 -translate-x-1/2"
        style={{ opacity }}
      >
        <motion.div
          className="h-8 w-px bg-[--fg-subtle]"
          animate={{ scaleY: [1, 0.5, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>
    </section>
  );
}
