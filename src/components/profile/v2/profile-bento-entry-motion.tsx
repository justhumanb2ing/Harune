"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

type ProfileBentoEntryMotionProps = {
  children: ReactNode;
  className?: string;
  ready?: boolean;
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

export function ProfileBentoGridMotion({
  children,
  className,
  ready = true,
}: ProfileBentoEntryMotionProps) {
  const shouldReduceMotion = Boolean(useReducedMotion());
  const motionState = getEntryMotion(shouldReduceMotion, 0.58, 14);
  const hiddenState = {
    opacity: 0,
    y: shouldReduceMotion ? 0 : 14,
  };

  return (
    <motion.section
      animate={ready ? motionState.animate : hiddenState}
      className={className}
      initial={motionState.initial}
      transition={ready ? motionState.transition : { duration: 0 }}
    >
      {children}
    </motion.section>
  );
}
