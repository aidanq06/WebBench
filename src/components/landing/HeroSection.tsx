"use client";

import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};

export function HeroSection() {
  const { scrollY } = useScroll();
  const opacity = useTransform(scrollY, [0, 400], [1, 0]);
  const y = useTransform(scrollY, [0, 400], [0, -40]);

  return (
    <section className="relative flex min-h-[100dvh] items-center justify-center px-6">
      {/* radial glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, hsl(0 0% 50% / 0.06) 0%, transparent 70%)",
        }}
      />

      <motion.div
        className="relative flex flex-col items-center gap-6 text-center"
        variants={stagger}
        initial="hidden"
        animate="show"
        style={{ opacity, y }}
      >
        <motion.h1
          variants={fadeUp}
          className="max-w-3xl text-3xl font-medium tracking-tighter sm:text-6xl"
        >
          webbench: a benchmark for ai agents in browser environments
        </motion.h1>
        <motion.p
          variants={fadeUp}
          className="max-w-xl text-sm text-muted-foreground sm:text-lg"
        >
          run a standardized task suite against a local llm entirely in your
          browser. no api keys, no server, no setup. powered by webgpu.
        </motion.p>
        <motion.div variants={fadeUp}>
          <Link
            href="/benchmark"
            className="mt-4 inline-block border bg-primary px-8 py-3 text-sm text-primary-foreground hover:bg-primary/90"
          >
            run benchmark
          </Link>
        </motion.div>
      </motion.div>
    </section>
  );
}
