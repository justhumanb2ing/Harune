import type { Variants } from "motion/react";
import * as motion from "motion/react-client";
import Image from "next/image";

const demoScreenshots = {
  desktop: {
    alt: "Desktop screenshot of a Harune public profile page",
    height: 1100,
    src: "/images/demo-page-desktop.png",
    width: 1440,
  },
  mobile: {
    alt: "Mobile screenshot of a Harune public profile page",
    height: 932,
    src: "/images/demo-page-mobile.png",
    width: 430,
  },
};

const copyVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 24,
  },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.52,
      ease: [0.16, 1, 0.3, 1],
    },
    y: 0,
  },
};

const imageVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.98,
    y: 36,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.66,
      ease: [0.16, 1, 0.3, 1],
    },
    y: 0,
  },
};

export default function LiveCardSection() {
  return (
    <section className="box-border flex h-lvh overflow-hidden px-4 py-20 md:py-28">
      <div className="mx-auto flex w-full max-w-7xl flex-col justify-center gap-20">
        <motion.div
          className="mx-auto flex w-full max-w-[52rem] flex-col items-center gap-3 text-center"
          initial="hidden"
          variants={copyVariants}
          viewport={{ once: true, margin: "-80px" }}
          whileInView="visible"
        >
          <h2 className="max-w-full text-balance text-3xl font-bold leading-tight tracking-normal md:text-5xl">
            A simple page, just for you
            <span className="text-indigo-400">.</span>
          </h2>
        </motion.div>

        <div className="relative">
          <video
            src="https://cdn.harune.me/public/assets/landing_showcase.webm"
            autoPlay
            className="size-full object-cover rounded-2xl"
            loop
            muted
            playsInline
            preload="metadata"
          />
        </div>
      </div>
    </section>
  );
}
