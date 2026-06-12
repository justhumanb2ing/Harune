"use client";

import { useReducedMotion } from "motion/react";
import * as motion from "motion/react-client";
import type { ReactNode } from "react";

type ProfileBentoSurfaceMotionProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  initialScale?: number;
  initialY?: number;
  reduceMotionDuration?: number;
  reduceMotionY?: number;
  revealMode?: "transform" | "opacity";
};

export function ProfileBentoSurfaceMotion({
  children,
  className,
  delay = 0,
  duration = 0.68,
  initialScale = 1,
  initialY = 28,
  reduceMotionDuration = 0.34,
  reduceMotionY = 8,
  revealMode = "transform",
}: ProfileBentoSurfaceMotionProps) {
  const shouldReduceMotion = Boolean(useReducedMotion());
  const usesTransform = revealMode === "transform";

  return (
    <motion.div
      className={className}
      initial={
        usesTransform
          ? shouldReduceMotion
            ? { opacity: 0, scale: 1, y: reduceMotionY }
            : { opacity: 0, scale: initialScale, y: initialY }
          : { opacity: 0 }
      }
      animate={usesTransform ? { opacity: 1, scale: 1, y: 0 } : { opacity: 1 }}
      transition={{
        delay: shouldReduceMotion ? delay * 0.4 : delay,
        duration: shouldReduceMotion ? reduceMotionDuration : duration,
        ease: [0.16, 1, 0.3, 1],
      }}
      style={{ willChange: usesTransform ? "transform, opacity" : "opacity" }}
    >
      {children}
    </motion.div>
  );
}
