"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Github, BookOpen } from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";

const WORDS = ["server.", "api key.", "setup.", "cloud.", "cost."] as const;
const LONGEST_WORD = "api key.";

export function HeroSection() {
  const { scrollY } = useScroll();
  const opacity = useTransform(scrollY, [0, 400], [1, 0]);
  const y = useTransform(scrollY, [0, 400], [0, -40]);

  const [wordIndex,  setWordIndex]  = useState(0);
  const [typedChars, setTypedChars] = useState(0);

  const currentWord = WORDS[wordIndex];

  useEffect(() => {
    let cancelled = false;
    let chars = 0;
    type Phase = "in" | "hold" | "out";
    let phase: Phase = "in";

    setTypedChars(0);

    function step() {
      if (cancelled) return;
      if (phase === "in") {
        chars++;
        setTypedChars(chars);
        if (chars < currentWord.length) {
          setTimeout(step, 80);
        } else {
          phase = "hold";
          setTimeout(step, 1200);
        }
      } else if (phase === "hold") {
        phase = "out";
        setTimeout(step, 0);
      } else {
        chars--;
        setTypedChars(chars);
        if (chars > 0) {
          setTimeout(step, 45);
        } else {
          setTimeout(() => {
            if (!cancelled) setWordIndex((i) => (i + 1) % WORDS.length);
          }, 200);
        }
      }
    }

    setTimeout(step, 80);
    return () => { cancelled = true; };
  }, [wordIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <section className="relative flex min-h-[100dvh] items-center justify-center px-6">
      <motion.div
        className="relative flex flex-col items-start gap-8 text-left -mt-16"
        style={{ opacity, y }}
      >
        {/* badges row */}
        <div className="flex items-center gap-3">
          <a
            href="https://github.com/aidanq06/WebBench"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 border px-4 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <Github className="h-3.5 w-3.5" />
            open source
          </a>
          <Link
            href="/questions"
            className="inline-flex items-center gap-2 border px-4 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <BookOpen className="h-3.5 w-3.5" />
            question set
          </Link>
        </div>

        <h1 className="text-4xl font-medium tracking-tighter sm:text-7xl">
          <span className="block whitespace-nowrap">benchmark local llms.</span>
          <span className="block whitespace-nowrap">
            no{" "}
            <span className="relative inline-block overflow-hidden align-bottom">
              {/* invisible anchor — locks width to longest word so "no " never shifts */}
              <span className="invisible select-none" aria-hidden>{LONGEST_WORD}</span>
              <span className="absolute inset-0 flex items-center justify-start">
                {currentWord.slice(0, typedChars)}
                <span className="animate-pulse opacity-60">|</span>
              </span>
            </span>
          </span>
        </h1>

        <p className="max-w-xl text-base text-muted-foreground sm:text-xl">
          a standardized suite of math, logic, coding, and reasoning questions.
          runs entirely in your browser via webgpu.
        </p>
        <div className="mt-2">
          <Link
            href="/benchmark"
            className="border bg-primary px-10 py-3.5 text-base text-primary-foreground hover:bg-primary/90"
          >
            run benchmark
          </Link>
        </div>
      </motion.div>

      {/* scroll hint */}
      <motion.div
        className="absolute bottom-10 left-1/2 -translate-x-1/2"
        style={{ opacity }}
      >
        <motion.div
          className="h-8 w-px bg-muted-foreground/30"
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>
    </section>
  );
}
