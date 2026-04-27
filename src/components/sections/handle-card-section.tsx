"use client";

import { type Variants, motion } from "motion/react";

type HandleChip = {
  className: string;
  handle: string;
  tone: string;
};

const handleChips: HandleChip[] = [
  {
    className:
      "left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2 text-5xl sm:text-6xl md:text-7xl",
    handle: "@kai",
    tone: "bg-foreground text-background",
  },
  {
    className: "left-[8%] top-[8%] -rotate-6 text-2xl sm:text-4xl",
    handle: "@DONNY",
    tone: "bg-sky-400 text-white",
  },
  {
    className: "right-[7%] top-[12%] rotate-5 text-xl sm:text-3xl md:text-4xl",
    handle: "@mika_studio",
    tone: "bg-indigo-400 text-white",
  },
  {
    className: "left-[6%] top-[42%] rotate-3 text-xl sm:text-3xl md:text-4xl",
    handle: "@NOVA7",
    tone: "bg-emerald-400 text-white",
  },
  {
    className: "right-[8%] top-[45%] -rotate-4 text-xl sm:text-3xl md:text-4xl",
    handle: "@lee_works",
    tone: "bg-rose-400 text-white",
  },
  {
    className: "bottom-[14%] left-[16%] -rotate-3 text-2xl sm:text-4xl",
    handle: "@juno",
    tone: "bg-orange-400 text-white",
  },
  {
    className: "bottom-[13%] right-[16%] rotate-6 text-2xl sm:text-4xl",
    handle: "@MAY_LI",
    tone: "bg-amber-300 text-foreground",
  },
  {
    className: "left-[27%] top-[26%] rotate-2 text-lg sm:text-2xl md:text-3xl",
    handle: "@arlo_42",
    tone: "bg-background/80 text-foreground",
  },
  {
    className: "right-[29%] top-[30%] -rotate-2 text-lg sm:text-2xl md:text-3xl",
    handle: "@zara",
    tone: "bg-fuchsia-400 text-white",
  },
  {
    className: "bottom-[30%] left-[28%] -rotate-5 text-lg sm:text-2xl md:text-3xl",
    handle: "@echo_lab",
    tone: "bg-background/80 text-foreground",
  },
  {
    className: "bottom-[29%] right-[28%] rotate-4 text-lg sm:text-2xl md:text-3xl",
    handle: "@chloeZ",
    tone: "bg-cyan-300 text-foreground",
  },
  {
    className: "left-[43%] top-[8%] hidden -rotate-2 text-2xl sm:block md:text-4xl",
    handle: "@ren_01",
    tone: "bg-lime-300 text-foreground",
  },
];

const sectionVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 48,
  },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.7,
      ease: [0.16, 1, 0.3, 1],
      staggerChildren: 0.1,
    },
    y: 0,
  },
};

const itemVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.94,
    y: 22,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.52,
      ease: [0.16, 1, 0.3, 1],
    },
    y: 0,
  },
};

const chipEntryVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.88,
    y: 28,
  },
  visible: (index: number) => ({
    opacity: 1,
    scale: 1,
    transition: {
      delay: 0.18 + index * 0.045,
      damping: 18,
      mass: 0.7,
      stiffness: 420,
      type: "spring",
    },
    y: 0,
  }),
};

export default function HandleCardSection() {
  return (
    <section className="flex min-h-dvh flex-col items-center justify-center overflow-hidden px-4 py-16">
      <motion.div
        className="flex w-full max-w-6xl flex-col items-center gap-52 md:gap-64"
        initial="hidden"
        variants={sectionVariants}
        viewport={{ once: true, margin: "-80px" }}
        whileInView="visible"
      >
        <motion.header
          className="flex w-full flex-col items-center gap-3 text-center"
          variants={itemVariants}
        >
          <p className="text-3xl font-semibold tracking-normal text-foreground md:text-5xl">
            Claim your handle
            <span className="text-indigo-400">.</span>
          </p>
          <p className="text-2xl font-normal md:text-3xl">Choose a unique name for your page.</p>
        </motion.header>

        <div className="flex flex-col items-center gap-16 w-full">
          <motion.div
            className="relative h-[520px] w-full overflow-hidden rounded-[2rem] sm:h-[580px]"
            variants={itemVariants}
          >
            <div className="pointer-events-none absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-background/70 blur-3xl" />
            {handleChips.map((chip, index) => (
              <div className={`absolute ${chip.className}`} key={chip.handle}>
                <motion.div
                  custom={index}
                  initial="hidden"
                  variants={chipEntryVariants}
                  viewport={{ once: true, margin: "-120px" }}
                  whileInView="visible"
                >
                  <motion.div
                    className={`flex w-fit select-none items-center rounded-2xl px-4 py-3 font-semibold tracking-normal shadow-float transition-shadow duration-150 ease-out hover:shadow-xl sm:rounded-3xl sm:px-5 sm:py-4 ${chip.tone}`}
                    whileHover={{
                      scale: 1.025,
                      y: -8,
                    }}
                    transition={{
                      damping: 30,
                      mass: 0.45,
                      stiffness: 520,
                      type: "spring",
                    }}
                  >
                    {chip.handle}
                  </motion.div>
                </motion.div>
              </div>
            ))}
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{
              delay: 0.45,
              duration: 0.45,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            <p className="text-lg text-muted-foreground md:text-2xl">and much more...</p>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
