"use client";

import { SocialPlatformIcon } from "@/components/icon";
import type { SocialPlatform } from "@/lib/profile-page/types";
import {
  type MotionStyle,
  type MotionValue,
  motion,
  useScroll,
  useSpring,
  useTransform,
} from "motion/react";
import Image from "next/image";
import { type ReactNode, useRef } from "react";

type ScatterState = {
  rotate: number;
  scale?: number;
  x: number;
  y: number;
};

type LiveCardItemProps = {
  children: ReactNode;
  className: string;
  itemId: string;
  progress: MotionValue<number>;
  scatter: ScatterState;
  style?: MotionStyle;
};

const liveCardSocialIcons: Array<{
  className: string;
  platform: SocialPlatform;
  scatter: ScatterState;
}> = [
  {
    className: "absolute left-[calc(50%_-_89px)] top-[472px] z-10",
    platform: "x",
    scatter: { rotate: -18, scale: 0.92, x: -224, y: 130 },
  },
  {
    className: "absolute left-[calc(50%_-_43px)] top-[472px] z-10",
    platform: "threads",
    scatter: { rotate: 14, scale: 1.08, x: 184, y: 82 },
  },
  {
    className: "absolute left-[calc(50%_+_3px)] top-[472px] z-10",
    platform: "instagram",
    scatter: { rotate: -10, scale: 0.98, x: -146, y: 206 },
  },
  {
    className: "absolute left-[calc(50%_+_49px)] top-[472px] z-10",
    platform: "soundcloud",
    scatter: { rotate: 16, scale: 0.95, x: 206, y: 174 },
  },
];

function LiveCardItem({
  children,
  className,
  itemId,
  progress,
  scatter,
  style,
}: LiveCardItemProps) {
  const x = useTransform(progress, [0, 1], [scatter.x, 0]);
  const y = useTransform(progress, [0, 1], [scatter.y, 0]);
  const rotate = useTransform(progress, [0, 1], [scatter.rotate, 0]);
  const scale = useTransform(progress, [0, 1], [scatter.scale ?? 1, 1]);

  return (
    <motion.div
      className={className}
      data-live-card-item={itemId}
      style={{ ...style, rotate, scale, x, y }}
    >
      {children}
    </motion.div>
  );
}

export default function LiveCardSection() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });
  const progress = useSpring(scrollYProgress, {
    damping: 28,
    mass: 0.45,
    stiffness: 140,
  });
  const frameOpacity = useTransform(progress, [0.12, 0.72], [0.18, 1]);
  const frameScale = useTransform(progress, [0, 1], [0.96, 1]);
  const titleOpacity = useTransform(progress, [0.46, 0.78], [0, 1]);
  const titleY = useTransform(progress, [0.46, 0.78], [44, 0]);
  const looseItemShadow = useTransform(
    progress,
    [0.14, 0.82],
    ["0px 20px 30px 1px rgba(0, 0, 0, 0.14)", "0px 0px 0px 0px rgba(0, 0, 0, 0)"]
  );
  const looseItemBorderColor = useTransform(
    progress,
    [0.14, 0.82],
    ["rgba(0, 0, 0, 0.14)", "rgba(0, 0, 0, 0)"]
  );
  const looseItemBackgroundOpacity = useTransform(progress, [0.14, 0.82], [1, 0]);
  const profilePadding = useTransform(progress, [0.14, 0.82], [4, 0]);

  return (
    <section ref={sectionRef} className="relative h-[240vh] overflow-x-clip">
      <div className="sticky top-0 flex h-dvh items-center justify-center px-4 py-12">
        <div className="-translate-y-20 scale-[0.78] sm:scale-90 md:-translate-y-24 md:scale-100">
          <motion.div
            className="relative h-[700px] w-[min(375px,calc(100vw-2rem))]"
            style={{ scale: frameScale }}
          >
            <motion.div
              className="absolute inset-0 rounded-[2rem] border border-border/60 bg-background shadow-brand"
              style={{ opacity: frameOpacity }}
            />

            {/* Background Image */}
            <LiveCardItem
              className="absolute left-0 top-0 h-48 w-full rounded-t-[2rem] p-0"
              itemId="background"
              progress={progress}
              scatter={{ rotate: -7, scale: 0.88, x: -180, y: 10 }}
              style={{
                boxShadow: looseItemShadow,
                padding: profilePadding,
              }}
            >
              <div className="relative size-full overflow-hidden rounded-t-[2rem]">
                <Image
                  src="/images/live-card-background.jpeg"
                  alt="Kai Donovan background artwork"
                  fill
                  sizes="375px"
                  className="object-cover"
                  priority
                />
              </div>
            </LiveCardItem>

            {/* Profile Image */}
            <LiveCardItem
              className="absolute left-1/2 top-32 z-10 -ml-16 size-32 rounded-full bg-background p-1 shadow-xl"
              itemId="profile"
              progress={progress}
              scatter={{ rotate: 13, scale: 1.08, x: 210, y: -82 }}
              style={{
                boxShadow: looseItemShadow,
                padding: profilePadding,
              }}
            >
              <div className="relative size-full overflow-hidden rounded-full">
                <Image
                  src="/images/live-card-profile.jpeg"
                  alt="Kai Donovan"
                  fill
                  sizes="128px"
                  className="object-cover"
                  priority
                />
              </div>
            </LiveCardItem>

            {/* Name */}
            <LiveCardItem
              className="absolute left-0 right-0 top-[284px] z-10 mx-auto w-fit rounded-xl border bg-background p-1"
              itemId="name"
              progress={progress}
              scatter={{ rotate: -9, x: -240, y: 2 }}
              style={{
                borderColor: looseItemBorderColor,
                boxShadow: looseItemShadow,
              }}
            >
              <h2 className="rounded-lg px-3 py-2 text-center text-3xl font-bold tracking-normal">
                Kai Donovan
              </h2>
            </LiveCardItem>

            {/* Role, Location */}
            <LiveCardItem
              className="absolute left-0 right-0 top-[333px] z-10 mx-auto w-fit rounded-xl border bg-background p-1"
              itemId="role"
              progress={progress}
              scatter={{ rotate: 7, x: 226, y: 22 }}
              style={{
                borderColor: looseItemBorderColor,
                boxShadow: looseItemShadow,
              }}
            >
              <p className="rounded-lg px-3 py-2 text-center text-sm text-neutral-600">
                Digital Artist / in New York, USA
              </p>
            </LiveCardItem>

            {/* Bio */}
            <LiveCardItem
              className="absolute left-5 right-5 top-[382px] z-10 rounded-xl border bg-background p-2 text-center"
              itemId="bio"
              progress={progress}
              scatter={{ rotate: 8, scale: 0.96, x: -205, y: 112 }}
              style={{
                borderColor: looseItemBorderColor,
                boxShadow: looseItemShadow,
              }}
            >
              <p className="rounded-lg px-2 py-1 text-sm leading-6 text-neutral-800">
                Hi, I&apos;m Kai - a New York-based digital artist, creating bold visuals inspired
                by city energy, technology, and emotion.
              </p>
            </LiveCardItem>

            {/* Social Icons */}
            {liveCardSocialIcons.map((socialIcon) => (
              <LiveCardItem
                key={socialIcon.platform}
                className={socialIcon.className}
                itemId={`social-${socialIcon.platform}`}
                progress={progress}
                scatter={socialIcon.scatter}
              >
                <motion.div
                  className="flex size-10 items-center justify-center rounded-full border bg-background"
                  style={{
                    borderColor: looseItemBorderColor,
                    boxShadow: looseItemShadow,
                  }}
                >
                  <SocialPlatformIcon
                    platform={socialIcon.platform}
                    className="size-5"
                    aria-hidden="true"
                  />
                </motion.div>
              </LiveCardItem>
            ))}

            {/* Handle */}
            <LiveCardItem
              className="absolute left-0 right-0 top-[712px] z-10 mx-auto w-fit overflow-hidden rounded-xl border p-1"
              itemId="handle"
              progress={progress}
              scatter={{ rotate: -11, x: 232, y: -76 }}
              style={{
                borderColor: looseItemBorderColor,
                boxShadow: looseItemShadow,
              }}
            >
              <motion.div
                className="pointer-events-none absolute inset-0 bg-background"
                style={{ opacity: looseItemBackgroundOpacity }}
              />
              <p className="relative rounded-lg px-3 py-2 text-base font-medium">@kaidonovan</p>
            </LiveCardItem>

            {/* Link 1 */}
            <LiveCardItem
              className="absolute left-4 right-4 top-[528px] z-10 rounded-md bg-background p-2 shadow-float"
              itemId="link-1"
              progress={progress}
              scatter={{ rotate: 7, x: -224, y: 150 }}
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="relative size-8 shrink-0 overflow-hidden rounded-sm">
                  <Image
                    src="/images/live-card-link-icon.png"
                    alt="My Artwork favicon"
                    fill
                    sizes="32px"
                    className="object-cover"
                  />
                </div>
                <p className="truncate text-sm font-medium leading-snug">My Artwork</p>
              </div>
            </LiveCardItem>

            {/* Link 2 */}
            <LiveCardItem
              className="absolute left-4 right-4 top-[584px] z-10 rounded-md bg-background p-2 shadow-float"
              itemId="link-2"
              progress={progress}
              scatter={{ rotate: -8, x: 202, y: 170 }}
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="relative size-8 shrink-0 overflow-hidden rounded-sm">
                  <Image
                    src="/images/live-card-link-icon-2.png"
                    alt="ArtStation favicon"
                    fill
                    sizes="32px"
                    className="object-cover"
                  />
                </div>
                <p className="truncate text-sm font-medium leading-snug">Profile on ArtStation</p>
              </div>
            </LiveCardItem>

            {/* Link 3 */}
            <LiveCardItem
              className="absolute left-4 right-4 top-[640px] z-10 rounded-md bg-background p-2 shadow-float"
              itemId="link-3"
              progress={progress}
              scatter={{ rotate: 5, x: 8, y: 190 }}
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="relative size-8 shrink-0 overflow-hidden rounded-sm">
                  <Image
                    src="/images/live-card-link-icon-3.png"
                    alt="Playlist favicon"
                    fill
                    sizes="32px"
                    className="object-cover"
                  />
                </div>
                <p className="truncate text-sm font-medium leading-snug">Playlist for Artwork</p>
              </div>
            </LiveCardItem>
          </motion.div>
        </div>

        <motion.p
          className="pointer-events-none absolute bottom-18 left-4 right-4 text-center text-3xl font-semibold tracking-normal text-foreground md:bottom-22 md:text-5xl flex flex-col items-center gap-4"
          style={{ opacity: titleOpacity, y: titleY }}
        >
          <span>A simple page, just for you.</span>
          <span className="text-xl font-normal">
            Bring your links, socials, and style into one page.
          </span>
        </motion.p>
      </div>
    </section>
  );
}
