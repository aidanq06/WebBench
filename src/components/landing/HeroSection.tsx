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
        <motion.div variants={fadeUp} className="mt-4">
          <Link
            href="/benchmark"
            className="border bg-primary px-8 py-3 text-sm text-primary-foreground hover:bg-primary/90"
          >
            run benchmark
          </Link>
        </motion.div>
      </motion.div>

      {/* scroll hint */}
      <motion.div
        className="absolute bottom-10 left-1/2 -translate-x-1/2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.8 }}
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
