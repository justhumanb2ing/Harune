"use client";

import { AnimatePresence, type Variants, motion } from "motion/react";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useRef } from "react";

type Direction = "forward" | "backward";

const routeVariants: Variants = {
  enter: (direction: Direction) => ({
    opacity: 0.2,
    x: direction === "forward" ? 28 : -28,
  }),
  center: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.34,
      ease: "easeInOut",
    },
  },
  exit: (direction: Direction) => ({
    opacity: 0,
    x: direction === "forward" ? -28 : 28,
    transition: {
      duration: 0.28,
      ease: "easeInOut",
    },
  }),
};

function getSectionDepth(pathname: string): number {
  if (pathname === "/section") {
    return 0;
  }

  if (pathname.startsWith("/section/")) {
    return 1;
  }

  return 0;
}

type SectionRouteTransitionProps = {
  children: ReactNode;
};

export function SectionRouteTransition({ children }: SectionRouteTransitionProps) {
  const pathname = usePathname();
  const previousPathnameRef = useRef(pathname);
  const previousPathname = previousPathnameRef.current;
  const previousDepth = getSectionDepth(previousPathname);
  const currentDepth = getSectionDepth(pathname);
  const direction: Direction = currentDepth > previousDepth ? "forward" : "backward";

  useEffect(() => {
    previousPathnameRef.current = pathname;
  }, [pathname]);

  return (
    <AnimatePresence initial={false} mode="sync" custom={direction}>
      <motion.div
        key={pathname}
        custom={direction}
        variants={routeVariants}
        initial="enter"
        animate="center"
        exit="exit"
        className="will-change-transform"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
