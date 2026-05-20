"use client";

import { type MotionValue, motion, useTransform } from "motion/react";
import Image from "next/image";
import { type CSSProperties, type ReactNode, useEffect, useState } from "react";
import { normalizeGridTextSurfaceStyle } from "@/components/grid/grid-text-surface";
import { PROFILE_BENTO_PROFILE_SHELL_CLASS } from "@/components/profile/v2/profile-bento-profile-shell";
import { ProfileBentoReadonlyGrid } from "@/components/profile/v2/profile-bento-readonly-grid";
import type { ProfileBentoItem } from "@/lib/profile/types";

type ScatterState = {
  rotate: number;
  scale?: number;
  x: number;
  y: number;
};

type ViewportSize = {
  height: number;
  width: number;
};

type ProfileBentoLandingPreviewStyle = CSSProperties & {
  "--live-card-scale": string;
  "--live-card-width": string;
};

type SurfaceMetrics = {
  height: number;
  width: number;
};

type LandingPreviewItemProps = {
  children: ReactNode;
  className: string;
  itemId: string;
  progress: MotionValue<number>;
  scatter: ScatterState;
};

const DESKTOP_WIDTH = 1180;
const DESKTOP_HEIGHT = 760;
const COMPACT_WIDTH = 425;
const COMPACT_HEIGHT = 1540;
const VIEWPORT_GUTTER = 32;
const RESERVED_HEIGHT = 172;
const MIN_SCALE = 0.34;

const landingProfilePage = {
  bio: "Digital artist building visual systems for music, spaces, and web culture.",
  image: "/images/live-card-profile.jpeg",
  location: "New York, USA",
  name: "Kai Donovan",
  role: "Digital Artist",
};

const landingBento: ProfileBentoItem[] = [
  {
    id: "landing-section",
    type: "section",
    layout: {
      desktop: { x: 0, y: 0, w: 4, h: 1 },
      compact: { x: 0, y: 0, w: 2, h: 1 },
    },
    content: {
      title: "Selected work",
    },
  },
  {
    id: "landing-portfolio",
    type: "link",
    layout: {
      desktop: { x: 0, y: 2, w: 2, h: 2 },
      compact: { x: 0, y: 6, w: 2, h: 2 },
    },
    content: {
      title: "My Artwork",
      description: "Visual archive",
      favicon: "/images/live-card-link-icon.png",
      domain: "example.com",
      thumbnail: "/images/live-card-background.jpeg",
      url: "https://example.com/artwork",
    },
  },
  {
    id: "landing-media",
    type: "media",
    layout: {
      desktop: { x: 2, y: 2, w: 2, h: 4 },
      compact: { x: 0, y: 2, w: 2, h: 4 },
    },
    content: {
      alt: "Kai Donovan background artwork",
      caption: "City Energy Study",
      href: null,
      mediaType: "image",
      objectKey: "",
      url: "/images/live-card-background.jpeg",
    },
  },
  {
    id: "landing-note",
    type: "text",
    layout: {
      desktop: { x: 0, y: 4, w: 1, h: 2 },
      compact: { x: 0, y: 8, w: 1, h: 2 },
    },
    content: {
      style: normalizeGridTextSurfaceStyle({
        backgroundColor: "#ffffff",
        textAlign: "start",
        verticalAlign: "start",
      }),
      content: "New works, references, and notes from the studio.",
      url: "https://example.com/studio-notes",
    },
  },
  {
    id: "landing-artstation",
    type: "link",
    layout: {
      desktop: { x: 1, y: 4, w: 1, h: 2 },
      compact: { x: 1, y: 8, w: 1, h: 2 },
    },
    content: {
      title: "Profile on ArtStation",
      description: null,
      favicon: "/images/live-card-link-icon-2.png",
      domain: "example.com",
      thumbnail: null,
      url: "https://example.com/artstation",
    },
  },
  {
    id: "landing-notes",
    type: "link",
    layout: {
      desktop: { x: 0, y: 6, w: 2, h: 1 },
      compact: { x: 0, y: 10, w: 2, h: 1 },
    },
    content: {
      title: "Studio notes",
      description: null,
      favicon: "/images/live-card-link-icon-3.png",
      domain: "example.com",
      thumbnail: null,
      url: "https://example.com/notes",
    },
  },
];

function getViewportSize(): ViewportSize {
  return {
    height: window.visualViewport?.height ?? window.innerHeight,
    width: window.innerWidth,
  };
}

function getSurfaceMetrics(width: number): SurfaceMetrics {
  if (width >= 1280) {
    return {
      height: DESKTOP_HEIGHT,
      width: DESKTOP_WIDTH,
    };
  }

  return {
    height: COMPACT_HEIGHT,
    width: COMPACT_WIDTH,
  };
}

function getScale(viewportSize: ViewportSize) {
  const surface = getSurfaceMetrics(viewportSize.width);
  const widthScale = (viewportSize.width - VIEWPORT_GUTTER) / surface.width;
  const heightScale = (viewportSize.height - RESERVED_HEIGHT) / surface.height;

  return Math.min(1, Math.max(MIN_SCALE, widthScale), Math.max(MIN_SCALE, heightScale));
}

function LandingPreviewItem({
  children,
  className,
  itemId,
  progress,
  scatter,
}: LandingPreviewItemProps) {
  const x = useTransform(progress, [0, 1], [scatter.x, 0]);
  const y = useTransform(progress, [0, 1], [scatter.y, 0]);
  const rotate = useTransform(progress, [0, 1], [scatter.rotate, 0]);
  const scale = useTransform(progress, [0, 1], [scatter.scale ?? 1, 1]);

  return (
    <motion.div className={className} data-live-card-item={itemId} style={{ rotate, scale, x, y }}>
      {children}
    </motion.div>
  );
}

function LandingProfileAside() {
  return (
    <aside className={PROFILE_BENTO_PROFILE_SHELL_CLASS}>
      <div className="flex flex-col gap-8 overflow-hidden">
        <div className="flex px-4">
          <div className="relative flex size-32 items-center justify-center overflow-hidden rounded-full bg-secondary xl:size-44">
            <Image
              alt={landingProfilePage.name}
              className="size-full object-cover"
              height={176}
              priority
              src={landingProfilePage.image}
              width={176}
            />
          </div>
        </div>

        <div className="flex flex-col gap-3 p-4 pt-0">
          <h2 className="min-h-8 whitespace-pre-line break-all p-0 font-bold text-3xl! xl:text-5xl!">
            {landingProfilePage.name}
          </h2>

          <p className="min-h-8 whitespace-pre-line break-all p-0 text-lg! xl:text-xl!">
            {landingProfilePage.bio}
          </p>

          <div className="flex flex-col gap-2 text-neutral-500">
            <p className="h-fit p-0 text-base!">{landingProfilePage.role}</p>
            <p className="h-fit p-0 text-base!">{landingProfilePage.location}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

function LandingPublicProfile({ progress }: { progress: MotionValue<number> }) {
  return (
    <section className="mx-auto flex min-h-0 w-full flex-col items-center gap-8 px-0 pb-8 pt-[var(--v2-page-top-offset)] [--v2-page-top-offset:2rem] xl:flex-row xl:items-stretch xl:justify-center xl:gap-[clamp(3rem,calc((100vw-80rem)*0.25+3rem),6rem)]">
      <LandingPreviewItem
        className="shrink-0"
        itemId="profile-aside"
        progress={progress}
        scatter={{ rotate: -7, scale: 0.92, x: -210, y: 42 }}
      >
        <LandingProfileAside />
      </LandingPreviewItem>

      <LandingPreviewItem
        className="min-w-0 flex-1"
        itemId="bento-grid"
        progress={progress}
        scatter={{ rotate: 6, scale: 0.94, x: 224, y: 96 }}
      >
        <ProfileBentoReadonlyGrid bento={landingBento} preventNavigation />
      </LandingPreviewItem>
    </section>
  );
}

export function ProfileBentoLandingPreview({ progress }: { progress: MotionValue<number> }) {
  const [viewportSize, setViewportSize] = useState<ViewportSize | null>(null);
  const surfaceMetrics = viewportSize
    ? getSurfaceMetrics(viewportSize.width)
    : { height: COMPACT_HEIGHT, width: COMPACT_WIDTH };
  const frameScale = useTransform(progress, [0, 1], [0.96, 1]);
  const titleOpacity = useTransform(progress, [0.46, 0.78], [0, 1]);
  const titleY = useTransform(progress, [0.46, 0.78], [44, 0]);
  const previewStyle: ProfileBentoLandingPreviewStyle = {
    "--live-card-scale": (viewportSize ? getScale(viewportSize) : 0.78).toString(),
    "--live-card-width": `${surfaceMetrics.width}px`,
    height: surfaceMetrics.height * (viewportSize ? getScale(viewportSize) : 0.78),
  };

  useEffect(() => {
    const updateViewportSize = () => {
      setViewportSize(getViewportSize());
    };

    updateViewportSize();
    window.addEventListener("resize", updateViewportSize);
    window.visualViewport?.addEventListener("resize", updateViewportSize);

    return () => {
      window.removeEventListener("resize", updateViewportSize);
      window.visualViewport?.removeEventListener("resize", updateViewportSize);
    };
  }, []);

  return (
    <>
      <div
        className="relative w-[min(var(--live-card-width),calc(100vw-2rem))] shrink-0"
        style={previewStyle}
      >
        <div className="absolute left-1/2 top-0 origin-top -translate-x-1/2 scale-[var(--live-card-scale)]">
          <motion.div
            className="relative w-[var(--live-card-width)] overflow-visible"
            style={{ minHeight: surfaceMetrics.height, scale: frameScale }}
          >
            <LandingPublicProfile progress={progress} />
          </motion.div>
        </div>
      </div>

      <motion.p
        className="pointer-events-none flex max-w-[min(44rem,calc(100vw-2rem))] shrink-0 flex-col items-center gap-3 text-center text-3xl font-semibold leading-tight tracking-normal text-foreground md:gap-4 md:text-5xl"
        style={{ opacity: titleOpacity, y: titleY }}
      >
        <p>
          <span>A simple page, just for you</span>
          <span className="text-indigo-400">.</span>
        </p>
        <span className="text-xl font-normal">
          Bring your links, socials, and style into one page.
        </span>
      </motion.p>
    </>
  );
}
