import type { Variants } from "motion/react";
import * as motion from "motion/react-client";
import { TextLoop } from "@/components/ui/text-loop";

type HandleChip = {
  handle: string;
  tone?: string;
};

type HandleSliderRow = {
  handles: HandleChip[];
  reverse?: boolean;
  speed: number;
};

const handleSliderRows: HandleSliderRow[] = [
  {
    speed: 64,
    handles: [
      { handle: "@kai", tone: "bg-foreground text-background" },
      { handle: "@mika_studio", tone: "bg-indigo-400 text-white" },
      { handle: "@NOVA7", tone: "bg-emerald-400 text-white" },
      { handle: "@juno", tone: "bg-orange-400 text-white" },
      { handle: "@zara", tone: "bg-fuchsia-400 text-white" },
      { handle: "@arlo_42", tone: "bg-background text-foreground" },
    ],
  },
  {
    reverse: true,
    speed: 78,
    handles: [
      { handle: "@DONNY", tone: "bg-sky-400 text-white" },
      { handle: "@lee_works", tone: "bg-rose-400 text-white" },
      { handle: "@MAY_LI", tone: "bg-amber-300 text-foreground" },
      { handle: "@echo_lab", tone: "bg-background text-foreground" },
      { handle: "@chloeZ", tone: "bg-cyan-300 text-foreground" },
      { handle: "@ren_01", tone: "bg-lime-300 text-foreground" },
    ],
  },
  {
    speed: 58,
    handles: [
      { handle: "@studio_nami", tone: "bg-violet-400 text-white" },
      { handle: "@min.archive", tone: "bg-stone-900 text-white" },
      { handle: "@river", tone: "bg-teal-300 text-foreground" },
      { handle: "@seoulafter", tone: "bg-red-400 text-white" },
      { handle: "@noah_lab", tone: "bg-yellow-300 text-foreground" },
      { handle: "@yuri", tone: "bg-blue-400 text-white" },
    ],
  },
];

const featuredHandles = ["kai", "mika_studio", "NOVA7", "studio_nami"] as const;

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

export default function HandleCardSection() {
  return (
    <section className="flex flex-col items-center justify-center overflow-hidden px-4 py-16">
      <motion.div
        className="flex w-full max-w-6xl flex-col items-center gap-16 md:gap-20"
        initial="hidden"
        variants={sectionVariants}
        viewport={{ once: true, margin: "-80px" }}
        whileInView="visible"
      >
        <motion.header
          className="flex w-full flex-col items-center gap-3 text-center"
          variants={itemVariants}
        >
          <p className="text-3xl font-bold tracking-normal text-foreground md:text-5xl">
            Claim your handle
            <span className="text-indigo-400">.</span>
          </p>
          <p className="text-xl font-normal md:text-2xl">Choose a unique name for your page.</p>
        </motion.header>

        <div className="flex w-full flex-col items-center gap-16">
          <motion.div className="flex w-full justify-center" variants={itemVariants}>
            <div className="inline-flex max-w-full items-center gap-2 overflow-hidden rounded-2xl bg-secondary px-5 py-4 text-xl font-semibold tracking-tight sm:px-7 sm:py-5 sm:text-3xl md:text-3xl">
              <span className="shrink-0 ">harune.me/</span>
              <TextLoop
                className="overflow-y-clip text-indigo-400 [perspective:1000px]"
                transition={{
                  type: "spring",
                  stiffness: 900,
                  damping: 80,
                  mass: 10,
                }}
                variants={{
                  initial: {
                    y: 20,
                    rotateX: 90,
                    opacity: 0,
                    filter: "blur(4px)",
                  },
                  animate: {
                    y: 0,
                    rotateX: 0,
                    opacity: 1,
                    filter: "blur(0px)",
                  },
                  exit: {
                    y: -20,
                    rotateX: -90,
                    opacity: 0,
                    filter: "blur(4px)",
                  },
                }}
              >
                {featuredHandles.map((handle) => (
                  <span className="inline-block" key={handle}>
                    {handle}
                  </span>
                ))}
              </TextLoop>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
