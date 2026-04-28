"use client";

import { motion, type Variants } from "motion/react";

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

export default function LeaderboardSection() {
  return (
    <section className="h-full flex flex-col">
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
          <h2 className="text-center text-3xl font-bold tracking-tight sm:text-5xl text-primary-foreground bg-green-400 rounded-xl p-3 px-6 py-3">
            Leaderboard
          </h2>
        </motion.div>
      </header>
      <main className="flex-1 flex items-center justify-center px-4 py-8 sm:px-6 lg:px-8 rounded-2xl mx-8">
        <div className="flex flex-col gap-2 items-center">
          <p className="font-medium text-lg">Leaderboard is on the horizon. 🚀</p>
          <p>It's in the works.</p>
        </div>
      </main>
    </section>
  );
}
