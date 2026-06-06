"use client";

import { useEffect } from "react";
import { useMotionValue, useSpring, useTransform, motion, useReducedMotion } from "framer-motion";

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  decimals?: number;
  className?: string;
}

export function AnimatedNumber({
  value,
  duration = 0.8,
  decimals = 0,
  className,
}: AnimatedNumberProps) {
  const reduced = useReducedMotion();
  const motionValue = useMotionValue(reduced ? value : 0);
  const springValue = useSpring(motionValue, {
    duration: duration * 1000,
    bounce: 0,
  });
  const display = useTransform(springValue, (v) => v.toFixed(decimals));

  useEffect(() => {
    motionValue.set(value);
  }, [value, motionValue]);

  if (reduced) {
    return <span className={className}>{value.toFixed(decimals)}</span>;
  }

  return <motion.span className={className}>{display}</motion.span>;
}
