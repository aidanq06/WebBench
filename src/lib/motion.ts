export const EASE = [0.16, 1, 0.3, 1] as const;
export const DURATIONS = { fast: 0.25, base: 0.4, slow: 0.6 } as const;

export type IntroStyle = "fade-rise" | "fade-rise-soft" | "scale-in" | "mask-wipe";
export const INTRO_STYLE: IntroStyle = "fade-rise";

export const fadeUp = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 8 },
  transition: { duration: DURATIONS.base, ease: EASE },
};

export const stagger = {
  animate: { transition: { staggerChildren: 0.04 } },
};

export const fadeUpItem = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: DURATIONS.base, ease: EASE },
};

// ── Run-screen "staggered cascade" DNA ──
// Extracted from ModelSelector. Used to give home/models/methodology/questions
// the same item-cascade rhythm as the model grid on the run screen.
//
// BASE_DELAY exists because the route wrapper (.page-fade-up in globals.css)
// fades the whole page in over ~300ms. Per-component animations need to start
// AFTER that reveal completes, otherwise they play behind a still-fading
// parent and are invisible.

export const STAGGER_MS = 0.04;
export const ITEM_RISE_PX = 8;
export const ITEM_DURATION = 0.5;
export const BASE_DELAY = 0.25;

export const staggerItem = (idx: number) => ({
  initial: { opacity: 0, y: ITEM_RISE_PX },
  animate: { opacity: 1, y: 0 },
  transition: {
    duration: ITEM_DURATION,
    ease: EASE,
    delay: BASE_DELAY + idx * STAGGER_MS,
  },
});

export const staggerItemInView = (idx: number) => ({
  initial: { opacity: 0, y: ITEM_RISE_PX },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.1, margin: "0px 0px -40px 0px" },
  transition: {
    duration: ITEM_DURATION,
    ease: EASE,
    delay: BASE_DELAY + idx * STAGGER_MS,
  },
});

export const dataBarReveal = (idx: number, targetPct: number) => ({
  initial: { width: 0 },
  animate: { width: `${targetPct}%` },
  transition: {
    duration: 0.6,
    ease: "easeOut",
    delay: BASE_DELAY + 0.15 + idx * STAGGER_MS,
  },
});
