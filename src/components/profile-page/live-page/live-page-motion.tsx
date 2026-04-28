"use client";

import { motion, useReducedMotion } from "motion/react";
import { Children, type ReactNode } from "react";

const EMPHASIZED_EASE = [0.22, 1, 0.36, 1] as const;
const REVEAL_DURATION = 0.52;
const ITEM_REVEAL_DURATION = 0.44;
const BACKGROUND_REVEAL_DURATION = 0.78;
const AVATAR_REVEAL_DURATION = 0.62;
const REDUCED_MOTION_DURATION = 0.2;

type RevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
};

function getRevealState(shouldReduceMotion: boolean, y: number) {
  return shouldReduceMotion
    ? {
        hidden: { opacity: 0 },
        visible: { opacity: 1 },
      }
    : {
        hidden: { filter: "blur(4px)", opacity: 0, y },
        visible: { filter: "blur(0px)", opacity: 1, y: 0 },
      };
}

export function PublicProfileReveal({ children, className, delay = 0, y = 10 }: RevealProps) {
  const shouldReduceMotion = useReducedMotion();
  const revealState = getRevealState(Boolean(shouldReduceMotion), y);

  return (
    <motion.div
      animate="visible"
      className={className}
      initial="hidden"
      transition={{
        delay,
        duration: shouldReduceMotion ? REDUCED_MOTION_DURATION : REVEAL_DURATION,
        ease: EMPHASIZED_EASE,
      }}
      variants={revealState}
    >
      {children}
    </motion.div>
  );
}

type StaggerProps = RevealProps & {
  itemClassName?: string;
  stagger?: number;
};

export function PublicProfileStagger({
  children,
  className,
  delay = 0,
  itemClassName,
  stagger = 0.06,
  y = 12,
}: StaggerProps) {
  const shouldReduceMotion = useReducedMotion();
  const itemVariants = getRevealState(Boolean(shouldReduceMotion), y);

  return (
    <motion.div
      animate="visible"
      className={className}
      initial="hidden"
      variants={{
        hidden: {},
        visible: {
          transition: {
            delayChildren: delay,
            staggerChildren: shouldReduceMotion ? 0 : stagger,
          },
        },
      }}
    >
      {Children.map(children, (child) =>
        child ? (
          <motion.div
            className={itemClassName}
            transition={{
              duration: shouldReduceMotion ? REDUCED_MOTION_DURATION : ITEM_REVEAL_DURATION,
              ease: EMPHASIZED_EASE,
            }}
            variants={itemVariants}
          >
            {child}
          </motion.div>
        ) : null
      )}
    </motion.div>
  );
}

type ImageMotionProps = {
  alt?: string;
  className: string;
  src: string;
};

export function PublicProfileBackgroundImageMotion({ alt = "", className, src }: ImageMotionProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.img
      alt={alt}
      animate={{ opacity: 1, scale: 1 }}
      className={className}
      initial={{
        opacity: 0,
        scale: shouldReduceMotion ? 1 : 1.02,
      }}
      src={src}
      transition={{
        duration: shouldReduceMotion ? REDUCED_MOTION_DURATION : BACKGROUND_REVEAL_DURATION,
        ease: EMPHASIZED_EASE,
      }}
    />
  );
}

export function PublicProfileAvatarMotion({ alt = "", className, src }: ImageMotionProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.img
      alt={alt}
      animate={{
        opacity: 1,
        scale: 1,
        y: 0,
      }}
      className={className}
      initial={{
        opacity: 0,
        scale: shouldReduceMotion ? 1 : 0.96,
        y: shouldReduceMotion ? 0 : 12,
      }}
      src={src}
      transition={{
        delay: 0.14,
        duration: shouldReduceMotion ? REDUCED_MOTION_DURATION : AVATAR_REVEAL_DURATION,
        ease: EMPHASIZED_EASE,
      }}
    />
  );
}
