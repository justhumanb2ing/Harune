"use client";

import type { Variants } from "motion/react";
import * as motion from "motion/react-client";
import Image from "next/image";
import { AppEntryCtaButton } from "@/components/website/app-entry-cta-button";
import {
  getLandingCardShowcaseSize,
  LandingShowcaseItem,
  showcaseItems,
} from "@/components/website/landing/landing-card-showcase";
import { env } from "@/env";
import { cn } from "@/lib/utils";

const signInEnabled = env.NEXT_PUBLIC_SIGNIN_ENABLED === "true";

const heroShowcasePlacements = {
  "showcase-map": {
    className:
      "max-[818px]:left-[-22%] max-[818px]:top-[-10%] left-[1%] top-[6%] sm:left-[-12%] sm:top-[-2%] lg:left-[-4%] lg:top-[0%]",
    rotate: -12,
    zIndex: 1,
  },
  "showcase-media": {
    className:
      "max-[818px]:right-[-22%] max-[818px]:top-[-6%] right-[1%] top-[10%] sm:right-[-12%] sm:top-[-2%] lg:right-[-4%] lg:top-[4%]",
    rotate: 8,
    zIndex: 1,
  },
  "showcase-portrait-media": {
    className:
      "max-[818px]:right-[-30%] max-[818px]:bottom-[-10%] right-[5%] bottom-[12%] sm:right-[-16%] sm:bottom-[-2%] lg:right-[-1%] lg:bottom-[6%]",
    rotate: -9,
    zIndex: 2,
  },
  "showcase-text": {
    className:
      "max-[818px]:left-[-24%] max-[818px]:bottom-[2%] left-[4%] bottom-[12%] sm:left-[-16%] sm:bottom-[-2%] lg:left-[-1%] lg:bottom-[6%]",
    rotate: 6,
    zIndex: 2,
  },
  "showcase-text-secondary": {
    className:
      "max-[818px]:right-[8%] max-[818px]:bottom-[12%] max-[818px]:translate-x-0 right-[8%] bottom-[12%] sm:right-[-10%] sm:bottom-[10%] lg:right-[16%] lg:bottom-[18%]",
    rotate: -4,
    zIndex: 2,
  },
  "showcase-spotify": {
    className:
      "max-[818px]:left-[-20%] max-[818px]:top-[38%] left-[8%] top-[34%] sm:left-[-14%] sm:top-[32%] lg:left-[0%] lg:top-[30%]",
    rotate: -7,
    zIndex: 1,
  },
  "showcase-youtube": {
    className:
      "max-[818px]:right-[-66%] max-[818px]:top-[38%] right-[5%] top-[34%] sm:right-[-22%] sm:top-[32%] lg:right-[-10%] lg:top-[34%]",
    rotate: 2,
    zIndex: 2,
  },
  "showcase-twitter": {
    className:
      "max-[818px]:left-[-16%] max-[818px]:bottom-[-16%] max-[818px]:-translate-x-1/2 left-[14%] bottom-[7%] -translate-x-1/2 sm:left-[-8%] sm:bottom-[-10%] lg:left-[24%] lg:bottom-[2%]",
    rotate: -5,
    zIndex: 3,
  },
} as const;

const linkInBioVariants: Variants = {
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

function HeroShowcaseLayer() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-0 hidden overflow-hidden lg:block"
    >
      {showcaseItems.map((item, index) => {
        const placement = heroShowcasePlacements[item.id as keyof typeof heroShowcasePlacements];
        const desktopSize = getLandingCardShowcaseSize(item, "desktop");
        const compactSize = getLandingCardShowcaseSize(item, "compact");

        return (
          <motion.div
            key={item.id}
            className={cn("absolute will-change-transform", placement.className)}
            initial={{
              opacity: 0,
              rotate: placement.rotate - 8,
              scale: 0.88,
              y: 28,
            }}
            style={{ rotate: placement.rotate, zIndex: placement.zIndex }}
            transition={{
              delay: 0.18 + index * 0.045,
              damping: 18,
              mass: 0.7,
              stiffness: 420,
              type: "spring",
            }}
            whileInView={{
              opacity: 1,
              rotate: placement.rotate,
              scale: 1,
              y: 0,
            }}
            viewport={{ once: true, margin: "-120px" }}
          >
            <LandingShowcaseItem
              height={desktopSize.height}
              item={item}
              mobileHeight={compactSize.height}
              mobileWidth={compactSize.width}
              width={desktopSize.width}
            />
          </motion.div>
        );
      })}
    </div>
  );
}

export default function MainHeroSection() {
  return (
    <section className="relative isolate min-h-dvh overflow-hidden px-4 py-20 sm:px-6 sm:py-24">
      <HeroShowcaseLayer />
      <div className="relative z-20 mx-auto flex min-h-[calc(100dvh-10rem)] max-w-5xl flex-col items-center justify-center gap-40">
        <header className="flex flex-col items-center gap-4">
          <motion.div className="mb-20 flex flex-col items-center gap-2">
            <div className="size-16 aspect-square rounded-xl">
              <Image
                src={"/assets/logo.png"}
                alt="Harune Logo"
                width={256}
                height={256}
                className="mb-4 size-full rounded-lg object-cover"
              />
            </div>
            <h1 className="text-xl font-extrabold tracking-tighter sm:text-xl">Harune</h1>
          </motion.div>
          <motion.div
            animate="visible"
            className="cursor-default origin-left self-center rounded-2xl bg-background p-2 shadow-lg"
            initial="hidden"
            variants={linkInBioVariants}
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
            <h2 className="rounded-xl bg-indigo-400 p-3 px-6 py-3 text-center text-2xl font-bold tracking-tight text-primary-foreground sm:text-5xl">
              A Link in Bio
            </h2>
          </motion.div>
          <h3 className="flex flex-col items-center gap-6 text-3xl font-bold sm:text-5xl">
            <p>One page, all of you.</p>
            <p className="flex flex-col items-center font-normal text-base text-muted-foreground sm:text-xl">
              <span>Share everything you do, all in one place</span>
              <span>— create a page that shows who you are.</span>
            </p>
          </h3>
        </header>

        <div className="flex flex-col items-center gap-1">
          <AppEntryCtaButton
            next="/app"
            size="lg"
            className="brand-button h-12 min-w-48 rounded-xl px-24 py-8 text-base font-bold!"
          >
            <span className="uppercase sm:hidden">Sign up</span>
            <span className="hidden uppercase sm:inline">Sign Up For Free</span>
          </AppEntryCtaButton>
          {signInEnabled && (
            <AppEntryCtaButton next="/app" size="sm" variant="link" className="text-xs font-medium">
              Log In
            </AppEntryCtaButton>
          )}
        </div>
      </div>
    </section>
  );
}
