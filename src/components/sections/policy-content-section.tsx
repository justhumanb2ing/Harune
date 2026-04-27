"use client";

import { type Variants, motion } from "motion/react";
import type React from "react";

const variants: Variants = {
  hidden: {
    opacity: 0,
    rotate: -8,
    scale: 0.68,
    y: 36,
  },
  visible: {
    opacity: 1,
    rotate: -6,
    scale: 1,
    transition: {
      bounce: 0.42,
      damping: 11,
      mass: 0.75,
      stiffness: 420,
      type: "spring",
    },
    y: 0,
  },
};

export type PolicyContentSectionProps = {
  children: React.ReactNode;
  lastUpdatedLabel: string;
  title: string;
};

export default function PolicyContentSection({
  children,
  lastUpdatedLabel,
  title,
}: PolicyContentSectionProps) {
  return (
    <section className="flex min-h-dvh flex-col">
      <header className="h-[12rem] flex flex-col justify-center items-center mt-8">
        <motion.div
          animate="visible"
          className="origin-left self-center rounded-2xl bg-background p-2 shadow-xl cursor-default"
          initial="hidden"
          variants={variants}
          whileHover={{
            rotate: -8,
            scale: 1.06,
            transition: {
              bounce: 0.35,
              damping: 10,
              stiffness: 360,
              type: "spring",
            },
            y: -5,
          }}
        >
          <div className="m-0! text-center text-3xl font-bold tracking-tight sm:text-5xl text-primary-foreground bg-red-400 rounded-xl p-3 px-6 py-3">
            {title}
          </div>
        </motion.div>
        <p className="mt-6 text-sm text-muted-foreground">Last updated: {lastUpdatedLabel}</p>
      </header>
      <main className="policy-content mx-auto w-full max-w-3xl flex-1 rounded-3xl px-4 py-8 text-base text-black sm:px-6 lg:px-8 [&_a]:text-black [&_blockquote]:text-black [&_em]:text-black [&_h1]:text-black [&_h2]:text-black [&_h3]:text-black [&_h4]:text-black [&_li::marker]:text-black [&_li]:text-black [&_p]:text-black [&_strong]:text-black">
        {children}
      </main>
    </section>
  );
}
