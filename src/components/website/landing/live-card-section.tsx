import type { Variants } from "motion/react";
import * as motion from "motion/react-client";
import Image from "next/image";

const demoScreenshots = {
  desktop: {
    alt: "Desktop screenshot of a Harune public profile page",
    height: 1100,
    src: "/images/demo-page-desktop-20260502-1838.png",
    width: 1440,
  },
  mobile: {
    alt: "Mobile screenshot of a Harune public profile page",
    height: 932,
    src: "/images/demo-page-mobile-20260502-1838.png",
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
    <section className="overflow-hidden px-4 py-20 md:py-28">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <motion.div
          className="mx-auto flex w-full max-w-[52rem] flex-col items-center gap-3 text-center"
          initial="hidden"
          variants={copyVariants}
          viewport={{ once: true, margin: "-80px" }}
          whileInView="visible"
        >
          <h2 className="max-w-full text-balance text-3xl font-semibold leading-tight tracking-normal md:text-5xl">
            A simple page, just for you
            <span className="text-indigo-400">.</span>
          </h2>
          <p className="max-w-[42rem] text-pretty text-lg leading-relaxed md:text-2xl">
            Add maps, text, links, images, and videos into one page.
          </p>
        </motion.div>

        <div className="relative">
          <motion.div
            className="hidden lg:block"
            initial="hidden"
            variants={imageVariants}
            viewport={{ once: true, margin: "-120px" }}
            whileInView="visible"
          >
            <Image
              alt={demoScreenshots.desktop.alt}
              className="h-auto w-full"
              height={demoScreenshots.desktop.height}
              priority
              quality={92}
              sizes="(min-width: 1024px) 74vw, 100vw"
              src={demoScreenshots.desktop.src}
              width={demoScreenshots.desktop.width}
            />
          </motion.div>

          <motion.div
            className="mx-auto block w-full max-w-[26.875rem] lg:hidden"
            initial="hidden"
            variants={imageVariants}
            viewport={{ once: true, margin: "-120px" }}
            whileInView="visible"
          >
            <Image
              alt={demoScreenshots.mobile.alt}
              className="h-auto w-full"
              height={demoScreenshots.mobile.height}
              priority
              quality={92}
              sizes="(max-width: 1023px) min(100vw - 2rem, 26.875rem)"
              src={demoScreenshots.mobile.src}
              width={demoScreenshots.mobile.width}
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
