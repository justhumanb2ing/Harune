"use client";

import type { Variants } from "motion/react";
import * as motion from "motion/react-client";
import type { CSSProperties, ReactNode } from "react";
import { normalizeGridTextSurfaceStyle } from "@/components/profile/grid/grid-text-surface";
import {
  getProfileBentoLinkSize,
  ProfileBentoGridCard,
} from "@/components/profile/grid/profile-bento-grid-card";
import { toBentoGridItem } from "@/components/profile/grid/profile-bento-grid-model";
import { AppEntryCtaButton } from "@/components/website/app-entry-cta-button";
import { env } from "@/env";
import type { GridItem } from "@/lib/grid/grid-types";
import type { ProfileBentoItem } from "@/lib/profile/types";
import { cn } from "@/lib/utils";

const signInEnabled = env.NEXT_PUBLIC_SIGNIN_ENABLED === "true";
const providerIconBaseUrl = "https://cdn.harune.me/public/assets/link-provider-icon";

const landingCardShowcaseScale = 1;
const landingCardShowcaseGridMetrics = {
  compact: {
    columnWidth: 174,
    margin: 32,
    rowHeight: 71,
  },
  desktop: {
    columnWidth: 184,
    margin: 32,
    rowHeight: 76,
  },
} as const;
type LandingCardShowcaseBreakpoint = "compact" | "desktop";

type HeroShowcaseCardShellStyle = CSSProperties & {
  [key: `--${string}`]: string | number | undefined;
  "--grid-card-control-background"?: string;
  "--grid-card-muted-foreground"?: string;
  "--tw-inset-ring-color"?: string;
};

function getLandingCardShowcaseSize(
  item: ProfileBentoItem,
  breakpoint: LandingCardShowcaseBreakpoint
) {
  const layout = item.layout[breakpoint];
  const metrics = landingCardShowcaseGridMetrics[breakpoint];
  const width = layout.w * metrics.columnWidth + Math.max(0, layout.w - 1) * metrics.margin;
  const height = layout.h * metrics.rowHeight + Math.max(0, layout.h - 1) * metrics.margin;

  return {
    height: height * landingCardShowcaseScale,
    width: width * landingCardShowcaseScale,
  };
}

function HeroShowcaseCardShell({
  children,
  gridItem,
}: {
  children: ReactNode;
  gridItem: GridItem;
}) {
  const isFullBleedItem = gridItem.itemType === "media" || gridItem.itemType === "map";
  const shellStyle = gridItem.theme
    ? {
        "--grid-card-control-background": gridItem.theme.controlBackgroundColor,
        "--grid-card-muted-foreground": gridItem.theme.mutedForegroundColor,
        "--tw-inset-ring-color": `color-mix(in srgb, ${gridItem.theme.backgroundColor} 90%, black)`,
        backgroundColor: gridItem.theme.backgroundColor,
        color: gridItem.theme.foregroundColor,
      }
    : {
        "--tw-inset-ring-color": "color-mix(in srgb, var(--border) 80%, transparent)",
      };

  return (
    <article
      className={cn(
        "relative flex size-full min-h-0 flex-col justify-between rounded-[1.5rem] bg-white shadow-xs",
        isFullBleedItem ? "p-0 outline-none" : "p-4 outline-border/35 inset-ring-1"
      )}
      style={shellStyle satisfies HeroShowcaseCardShellStyle}
    >
      <div className="min-h-0 flex-1">{children}</div>
    </article>
  );
}

const showcaseItems = [
  {
    content: {
      caption: "",
      latitude: 40.7233,
      longitude: -74.003,
      url: "https://www.google.com/maps?q=40.7233,-74.0030",
      zoom: 13,
    },
    id: "showcase-map",
    layout: { compact: { h: 4, w: 2, x: 0, y: 0 }, desktop: { h: 4, w: 2, x: 0, y: 0 } },
    type: "map",
  },
  {
    content: {
      alt: "Rainy New York street after dark",
      caption: "",
      contentHash: "showcase-media",
      contentType: "image/jpeg",
      href: null,
      mediaType: "image",
      objectKey: "showcase-media",
      url: "https://i1-c.pinimg.com/736x/9a/80/20/9a8020c5be385d817b2aa648596aa51c.jpg",
    },
    id: "showcase-media",
    layout: { compact: { h: 4, w: 2, x: 0, y: 0 }, desktop: { h: 4, w: 2, x: 0, y: 0 } },
    type: "media",
  },
  {
    content: {
      alt: "Portrait photo used as a tall showcase card",
      caption: "",
      contentHash: "showcase-portrait-media",
      contentType: "image/jpeg",
      href: null,
      mediaType: "image",
      objectKey: "showcase-portrait-media",
      url: "https://i.pinimg.com/736x/b0/8d/5c/b08d5cfc82d33edc5538bfaba9ad0e65.jpg",
    },
    id: "showcase-portrait-media",
    layout: { compact: { h: 4, w: 1, x: 0, y: 0 }, desktop: { h: 4, w: 1, x: 0, y: 0 } },
    type: "media",
  },
  {
    content: {
      style: normalizeGridTextSurfaceStyle({
        backgroundColor: "#ffffff",
        textAlign: "start",
        verticalAlign: "start",
      }),
      content: "New York always feels busy, but somehow the calmest moment still shows up here.",
      url: "https://example.com/new-york-note",
    },
    id: "showcase-text",
    layout: { compact: { h: 2, w: 1, x: 0, y: 0 }, desktop: { h: 2, w: 1, x: 0, y: 0 } },
    type: "text",
  },
  {
    content: {
      description: null,
      favicon: `${providerIconBaseUrl}/spotify.svg`,
      domain: "open.spotify.com",
      thumbnail: null,
      title: "Night walk playlist",
      url: "https://open.spotify.com/",
    },
    id: "showcase-spotify",
    layout: { compact: { h: 2, w: 1, x: 0, y: 0 }, desktop: { h: 2, w: 1, x: 0, y: 0 } },
    type: "link",
  },
  {
    content: {
      description: null,
      favicon: `${providerIconBaseUrl}/youtube.svg`,
      domain: "youtube.com",
      thumbnail: null,
      title: "Street interview cut",
      url: "https://www.youtube.com/",
    },
    id: "showcase-youtube",
    layout: { compact: { h: 2, w: 2, x: 0, y: 0 }, desktop: { h: 2, w: 2, x: 0, y: 0 } },
    type: "link",
  },
  {
    content: {
      description: null,
      favicon: `${providerIconBaseUrl}/x.svg`,
      domain: "x.com",
      thumbnail: null,
      title: "@Ethan_Vale",
      url: "https://x.com/",
    },
    id: "showcase-twitter",
    layout: { compact: { h: 2, w: 1, x: 0, y: 0 }, desktop: { h: 2, w: 1, x: 0, y: 0 } },
    type: "link",
  },
] satisfies ProfileBentoItem[];

function HeroShowcaseCard({
  activeBreakpoint,
  item,
}: {
  activeBreakpoint: LandingCardShowcaseBreakpoint;
  item: ProfileBentoItem;
}) {
  const gridItem = toBentoGridItem(item);

  return (
    <HeroShowcaseCardShell gridItem={gridItem}>
      <ProfileBentoGridCard
        activeBreakpoint={activeBreakpoint}
        item={item}
        layoutSize={
          item.type === "link"
            ? getProfileBentoLinkSize(
                item.layout[activeBreakpoint].w,
                item.layout[activeBreakpoint].h
              )
            : undefined
        }
        preventNavigation
      />
    </HeroShowcaseCardShell>
  );
}

function LandingShowcaseItem({
  item,
  mobileHeight,
  mobileWidth,
  width,
  height,
}: {
  item: ProfileBentoItem;
  mobileHeight: number;
  mobileWidth: number;
  width: number;
  height: number;
}) {
  return (
    <>
      <div
        className="block shrink-0 min-[819px]:hidden"
        style={{
          height: `${mobileHeight}px`,
          width: `${mobileWidth}px`,
        }}
      >
        <HeroShowcaseCard activeBreakpoint="compact" item={item} />
      </div>

      <div
        className="hidden shrink-0 min-[819px]:block"
        style={{
          height: `${height}px`,
          width: `${width}px`,
        }}
      >
        <HeroShowcaseCard activeBreakpoint="desktop" item={item} />
      </div>
    </>
  );
}

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
      "max-[818px]:left-[-16%] max-[818px]:bottom-[-16%] max-[818px]:-translate-x-1/2 left-[14%] bottom-[7%] -translate-x-1/2 sm:left-[-8%] sm:bottom-[-10%] lg:left-[5%] lg:bottom-[32%]",
    rotate: 5,
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
          {/*<motion.div className="mb-20 flex flex-col items-center gap-2">
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
          </motion.div>*/}
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

        <div className="flex flex-col items-center gap-2">
          <AppEntryCtaButton
            next="/"
            size="lg"
            className="brand-button h-12 w-60 lg:w-80 rounded-xl px-24 py-8 text-base lg:text-lg font-bold!"
          >
            <span className="uppercase sm:hidden">Sign up</span>
            <span className="hidden uppercase sm:inline">Sign Up For Free</span>
          </AppEntryCtaButton>
          {signInEnabled && (
            <AppEntryCtaButton
              next="/"
              size="sm"
              variant="ghost"
              className="text-sm font-medium text-muted-foreground"
            >
              Log In
            </AppEntryCtaButton>
          )}
        </div>
      </div>
    </section>
  );
}
