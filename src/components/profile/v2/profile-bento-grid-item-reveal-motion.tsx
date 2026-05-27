"use client";

import { useReducedMotion } from "motion/react";
import * as motion from "motion/react-client";
import type { ReactNode } from "react";

const PROFILE_BENTO_GRID_ITEM_REVEAL_INITIAL_OPACITY = 0;
const PROFILE_BENTO_GRID_ITEM_REVEAL_STEP = 0.055;
const PROFILE_BENTO_GRID_ITEM_REVEAL_DURATION = 0.72;
const PROFILE_BENTO_GRID_ITEM_REDUCED_REVEAL_DURATION = 0.24;
const PROFILE_BENTO_GRID_ITEM_REVEAL_Y = 18;

type ProfileBentoGridItemRevealMotionProps = {
  children: ReactNode;
  index: number;
};

export function ProfileBentoGridItemRevealMotion({
  children,
  index,
}: ProfileBentoGridItemRevealMotionProps) {
  const shouldReduceMotion = Boolean(useReducedMotion());

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="size-full min-h-0"
      initial={
        shouldReduceMotion
          ? { opacity: PROFILE_BENTO_GRID_ITEM_REVEAL_INITIAL_OPACITY, y: 0 }
          : {
              opacity: PROFILE_BENTO_GRID_ITEM_REVEAL_INITIAL_OPACITY,
              y: PROFILE_BENTO_GRID_ITEM_REVEAL_Y,
            }
      }
      transition={{
        delay: index * PROFILE_BENTO_GRID_ITEM_REVEAL_STEP,
        duration: shouldReduceMotion
          ? PROFILE_BENTO_GRID_ITEM_REDUCED_REVEAL_DURATION
          : PROFILE_BENTO_GRID_ITEM_REVEAL_DURATION,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {children}
    </motion.div>
  );
}
