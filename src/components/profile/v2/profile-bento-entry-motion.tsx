"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

type ProfileBentoEntryMotionProps = {
  children: ReactNode;
  className?: string;
};

const PROFILE_BENTO_ENTRY_EASE = [0.22, 1, 0.36, 1] as const;

function getEntryMotion(shouldReduceMotion: boolean, delay: number, y: number) {
  return {
    animate: {
      opacity: 1,
      y: 0,
    },
    initial: {
      opacity: 0,
      y: shouldReduceMotion ? 0 : y,
    },
    transition: {
      delay: shouldReduceMotion ? 0 : delay,
      duration: shouldReduceMotion ? 0.18 : 0.46,
      ease: PROFILE_BENTO_ENTRY_EASE,
    },
  };
}

export function ProfileBentoProfileMotion({ children, className }: ProfileBentoEntryMotionProps) {
  const shouldReduceMotion = Boolean(useReducedMotion());

  return (
    <motion.aside className={className} {...getEntryMotion(shouldReduceMotion, 0.08, 10)}>
      {children}
    </motion.aside>
  );
}

export function ProfileBentoGridMotion({ children, className }: ProfileBentoEntryMotionProps) {
  const shouldReduceMotion = Boolean(useReducedMotion());

  return (
    <motion.section className={className} {...getEntryMotion(shouldReduceMotion, 0.58, 14)}>
      {children}
    </motion.section>
  );
}
