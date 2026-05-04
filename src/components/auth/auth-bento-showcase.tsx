"use client";

import { motion, useMotionValue, useReducedMotion } from "motion/react";
import { useMemo } from "react";
import { GridCard } from "@/components/grid/grid-card";
import {
  getProfileBentoLinkSize,
  ProfileBentoGridCard,
} from "@/components/profile/v2/profile-bento-grid-card";
import {
  toBentoGridItem,
  toBentoGridLayouts,
} from "@/components/profile/v2/profile-bento-grid-model";
import type { ProfileBentoItem } from "@/lib/profile/types";

type AuthBentoPreviewItem = {
  item: ProfileBentoItem;
  className: string;
  rotation: number;
  delay: number;
};

const AUTH_BENTO_ITEMS: AuthBentoPreviewItem[] = [
  {
    className: "col-start-4 row-start-1 col-span-1 row-span-1",
    rotation: -7,
    delay: 0.08,
    item: {
      id: "auth-map-seongsu",
      type: "map",
      layout: {
        desktop: { x: 3, y: 0, w: 1, h: 1 },
        compact: { x: 1, y: 0, w: 1, h: 1 },
      },
      content: {
        latitude: 37.5446,
        longitude: 127.0557,
        zoom: 13,
        url: "https://www.google.com/maps?q=37.544600,127.055700",
        caption: "",
      },
    },
  },
  {
    className: "col-start-2 row-start-1 col-span-2 row-span-2",
    rotation: 3.5,
    delay: 0,
    item: {
      id: "auth-media-studio",
      type: "media",
      layout: {
        desktop: { x: 1, y: 0, w: 2, h: 2 },
        compact: { x: 0, y: 1, w: 2, h: 2 },
      },
      content: {
        mediaType: "image",
        url: "https://images.unsplash.com/photo-1518005020951-eccb494ad742?q=80&w=1200&auto=format&fit=crop&ixlib=rb-4.1.0",
        objectKey: "auth-preview/studio",
        href: null,
        alt: "Studio",
        caption: "",
      },
    },
  },
  {
    className: "col-start-1 row-start-3 col-span-2 row-span-1",
    rotation: -2.5,
    delay: 0.2,
    item: {
      id: "auth-media-gallery",
      type: "media",
      layout: {
        desktop: { x: 0, y: 2, w: 2, h: 1 },
        compact: { x: 0, y: 3, w: 2, h: 1 },
      },
      content: {
        mediaType: "image",
        url: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=900&auto=format&fit=crop&ixlib=rb-4.1.0",
        objectKey: "auth-preview/gallery",
        href: null,
        alt: "Gallery",
        caption: "",
      },
    },
  },
  {
    className: "col-start-3 row-start-4 col-span-2 row-span-1",
    rotation: 5,
    delay: 0.14,
    item: {
      id: "auth-link-behance",
      type: "link",
      layout: {
        desktop: { x: 2, y: 3, w: 2, h: 1 },
        compact: { x: 0, y: 4, w: 2, h: 1 },
      },
      content: {
        title: "Behance",
        description: null,
        favicon: "https://www.google.com/s2/favicons?domain=behance.net&sz=64",
        thumbnail:
          "https://images.unsplash.com/photo-1497366754035-f200968a6e72?q=80&w=800&auto=format&fit=crop&ixlib=rb-4.1.0",
        url: "https://www.behance.net/",
      },
    },
  },
  {
    className: "col-start-1 row-start-1 col-span-1 row-span-1",
    rotation: 8,
    delay: 0.26,
    item: {
      id: "auth-link-twitter",
      type: "link",
      layout: {
        desktop: { x: 0, y: 0, w: 1, h: 1 },
        compact: { x: 0, y: 0, w: 1, h: 1 },
      },
      content: {
        title: "Twitter",
        description: null,
        favicon: "https://www.google.com/s2/favicons?domain=x.com&sz=64",
        thumbnail: null,
        url: "https://x.com/",
      },
    },
  },
  {
    className: "col-start-4 row-start-2 col-span-1 row-span-1",
    rotation: -4,
    delay: 0.32,
    item: {
      id: "auth-link-github",
      type: "link",
      layout: {
        desktop: { x: 3, y: 1, w: 1, h: 1 },
        compact: { x: 1, y: 5, w: 1, h: 1 },
      },
      content: {
        title: "GitHub",
        description: null,
        favicon: "https://www.google.com/s2/favicons?domain=github.com&sz=64",
        thumbnail:
          "https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=700&auto=format&fit=crop&ixlib=rb-4.1.0",
        url: "https://github.com/",
      },
    },
  },
];

export default function AuthBentoShowcase() {
  const shouldReduceMotion = useReducedMotion();
  const cardRotate = useMotionValue(0);
  const cardX = useMotionValue(0);
  const bento = useMemo(() => AUTH_BENTO_ITEMS.map(({ item }) => item), []);
  const layouts = useMemo(() => toBentoGridLayouts(bento), [bento]);

  return (
    <div className="relative h-full overflow-hidden bg-background">
      <div className="absolute inset-x-10 inset-y-10 grid grid-cols-4 grid-rows-8 gap-8 xl:inset-x-16 xl:inset-y-14">
        {AUTH_BENTO_ITEMS.map(({ item, className, rotation, delay }) => {
          const gridItem = toBentoGridItem(item);
          const layoutSize =
            item.type === "link"
              ? getProfileBentoLinkSize(item.layout.desktop.w, item.layout.desktop.h)
              : undefined;

          return (
            <motion.div
              key={item.id}
              className={className}
              initial={
                shouldReduceMotion
                  ? { opacity: 1, rotate: rotation }
                  : { opacity: 0, y: 34, scale: 0.94, rotate: rotation - 4 }
              }
              animate={
                shouldReduceMotion
                  ? { opacity: 1, rotate: rotation }
                  : {
                      opacity: 1,
                      y: [0, -8, 0],
                      scale: 1,
                      rotate: rotation,
                    }
              }
              transition={
                shouldReduceMotion
                  ? { duration: 0 }
                  : {
                      opacity: { delay, duration: 0.42, ease: "easeOut" },
                      scale: { delay, type: "spring", stiffness: 180, damping: 18 },
                      rotate: { delay, type: "spring", stiffness: 150, damping: 17 },
                      y: {
                        delay: delay + 0.36,
                        duration: 4.8 + delay,
                        ease: "easeInOut",
                        repeat: Number.POSITIVE_INFINITY,
                      },
                    }
              }
            >
              <GridCard
                activeBreakpoint="desktop"
                cardRotate={cardRotate}
                cardX={cardX}
                isDragActive={false}
                item={gridItem}
                layouts={layouts}
                onRemove={() => {}}
                onResize={() => {}}
                readOnly
                shouldReduceMotion={Boolean(shouldReduceMotion)}
              >
                <ProfileBentoGridCard
                  activeBreakpoint="desktop"
                  item={item}
                  layoutSize={layoutSize}
                  preventNavigation
                />
              </GridCard>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
