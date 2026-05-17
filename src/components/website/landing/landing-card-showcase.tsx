"use client";

import type { Variants } from "motion/react";
import Image from "next/image";
import { type CSSProperties, useEffect, useState } from "react";
import {
  getBackgroundColorOption,
  getTextAlignClassName,
  getVerticalAlignClassName,
  normalizeGridTextSurfaceStyle,
} from "@/components/grid/grid-text-surface";
import { Map as BentoMap, MapMarker, type MapViewport, MarkerContent } from "@/components/ui/map";
import { resolveLinkProviderTheme } from "@/lib/metadata/link-provider-theme";
import type {
  ProfileLinkBento,
  ProfileMapBento,
  ProfileMediaBento,
  ProfileTextBento,
} from "@/lib/profile/types";
import { cn } from "@/lib/utils";

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
const LEEVE_MAP_STYLE = "/assets/leeve-mapbox-inspired-carto-maplibre-style.json";
const LEEVE_MAP_STYLES = {
  light: LEEVE_MAP_STYLE,
  dark: LEEVE_MAP_STYLE,
} as const;
const MAP_INTERACTION_OPTIONS = {
  dragRotate: false,
  keyboard: false,
  scrollZoom: false,
  touchPitch: false,
} as const;

export type LandingCardShowcaseBreakpoint = "compact" | "desktop";

export function getLandingCardShowcaseSize(
  item: (typeof showcaseItems)[number],
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

function LinkFavicon({ favicon, title }: { favicon: string | null; title: string }) {
  const hasFavicon = !!favicon;

  return (
    <span
      className={cn(
        "flex size-full shrink-0 items-center justify-center overflow-hidden rounded-lg",
        hasFavicon ? "bg-transparent" : "bg-muted/60"
      )}
    >
      {hasFavicon ? (
        // biome-ignore lint/performance/noImgElement: Link favicon thumbnails are rendered directly.
        <img
          alt=""
          className="pointer-events-none size-full object-cover select-none"
          height={32}
          src={favicon}
          width={32}
        />
      ) : (
        <span aria-hidden className="size-full bg-muted/40" />
      )}
      <span className="sr-only">{title ? `${title} favicon` : "Link favicon"}</span>
    </span>
  );
}

function ReadonlyLinkFavicon({
  favicon,
  href,
  provider,
  title,
}: {
  favicon: string | null;
  href: string;
  provider: string | null;
  title: string;
}) {
  const providerIconUrl = provider
    ? `https://cdn.harune.me/public/assets/link-provider-icon/${provider}.svg`
    : null;
  const [src, setSrc] = useState<string | null>(providerIconUrl ?? favicon);

  useEffect(() => {
    setSrc(providerIconUrl ?? favicon);
  }, [favicon, providerIconUrl]);

  return (
    <a
      aria-label={title ? `Open ${title}` : "Open link"}
      className={cn(
        "inline-flex size-9 shrink-0 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring/50 md:size-10",
        "surface-bevel"
      )}
      href={href}
      rel="noreferrer"
      target="_blank"
    >
      {src ? (
        <span className="flex size-full items-center justify-center overflow-hidden rounded-sm">
          {/* biome-ignore lint/performance/noImgElement: Provider SVGs are CDN-hosted and intentionally rendered directly. */}
          <img
            alt=""
            aria-hidden
            className="size-full select-none object-cover"
            src={src}
            onError={() => {
              if (src === providerIconUrl && favicon) {
                setSrc(favicon);
                return;
              }

              setSrc(null);
            }}
          />
          <span className="sr-only">{title ? `${title} icon` : "Link icon"}</span>
        </span>
      ) : (
        <LinkFavicon favicon={favicon} title={title} />
      )}
    </a>
  );
}

function ReadonlyLinkAction({
  backgroundColor,
  foregroundColor,
  href,
  label,
}: {
  backgroundColor: string;
  foregroundColor: string;
  href: string;
  label: string;
}) {
  return (
    <a
      aria-label={label}
      className={cn(
        "outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-ring/50 !bg-[var(--link-provider-action-background)] !text-[var(--link-provider-action-foreground)]",
        "inline-flex h-6 max-w-fit shrink-0 items-center justify-center truncate rounded-full px-4 py-4 font-semibold text-sm leading-none sm:h-8 sm:px-4 sm:text-sm md:px-4 md:py-4.5"
      )}
      href={href}
      rel="noreferrer"
      style={
        {
          "--link-provider-action-background": backgroundColor,
          "--link-provider-action-foreground": foregroundColor,
        } as CSSProperties
      }
      target="_blank"
    >
      {label}
    </a>
  );
}

function ReadonlyLinkTitle({ title }: { title: string }) {
  return (
    <h2 className="min-h-9 min-w-0 truncate rounded-lg px-0 py-1.5 font-medium text-base">
      {title}
    </h2>
  );
}

export function LandingLinkCard({ item }: { item: ProfileLinkBento }) {
  const providerTheme = resolveLinkProviderTheme(item.content.url);
  const provider = providerTheme?.provider ?? null;
  const isHorizontal = item.layout.desktop.w === 2 && item.layout.desktop.h === 1;

  return (
    <article
      className="pointer-events-none relative flex size-full min-h-0 flex-col justify-between rounded-[1.5rem] bg-white p-3.5 shadow-float outline outline-border/35"
      style={
        providerTheme
          ? {
              backgroundColor: providerTheme.backgroundColor,
            }
          : undefined
      }
    >
      <div className="size-full min-h-0 overflow-hidden rounded-lg">
        <div
          className={cn(
            "flex size-full min-h-0 p-2",
            isHorizontal ? "items-center gap-3" : "flex-col justify-between gap-3"
          )}
        >
          <div
            className={cn(
              "flex min-w-0",
              isHorizontal ? "flex-1 items-center gap-3" : "flex-1 flex-col justify-between gap-3"
            )}
          >
            <ReadonlyLinkFavicon
              favicon={item.content.favicon}
              href={item.content.url}
              provider={provider}
              title={item.content.title}
            />
            <ReadonlyLinkTitle title={item.content.title} />
          </div>
          {providerTheme ? (
            <ReadonlyLinkAction
              backgroundColor={providerTheme.actionBackgroundColor}
              foregroundColor={providerTheme.actionForegroundColor}
              href={item.content.url}
              label={providerTheme.actionLabel}
            />
          ) : null}
        </div>
      </div>
    </article>
  );
}

function MapPulseMarker({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "relative flex size-8 items-center justify-center rounded-full bg-white shadow-[0_8px_24px_rgb(0_0_0_/_0.22)]",
        className
      )}
    >
      <span className="absolute -z-10 size-12 animate-ping rounded-full bg-blue-500 opacity-50 [animation-duration:2.4s]" />
      <span className="relative size-[24px] rounded-full bg-blue-500 shadow-sm" />
    </span>
  );
}

export function LandingMapCard({ item }: { item: ProfileMapBento }) {
  const viewport: MapViewport = {
    bearing: 0,
    center: [item.content.longitude, item.content.latitude],
    pitch: 0,
    zoom: item.content.zoom,
  };

  return (
    <article className="surface-bevel pointer-events-none relative size-full overflow-visible rounded-[1.5rem] bg-muted shadow-float transition-colors duration-200 ease-out">
      <div className="absolute inset-0 overflow-hidden rounded-[inherit] [contain:paint]">
        <BentoMap
          className="size-full overflow-hidden rounded-[inherit] [contain:paint] [&_.maplibregl-marker]:pointer-events-none"
          styles={LEEVE_MAP_STYLES}
          viewport={viewport}
          {...MAP_INTERACTION_OPTIONS}
          dragPan={false}
          doubleClickZoom={false}
          touchZoomRotate={false}
        >
          <MapMarker latitude={item.content.latitude} longitude={item.content.longitude}>
            <MarkerContent className="pointer-events-none">
              <MapPulseMarker />
            </MarkerContent>
          </MapMarker>
        </BentoMap>
      </div>
    </article>
  );
}

export function LandingMediaCard({ item }: { item: ProfileMediaBento }) {
  return (
    <article className="surface-bevel pointer-events-none relative size-full overflow-hidden rounded-lg bg-muted shadow-float">
      <Image
        alt={item.content.alt}
        className="object-cover"
        fill
        sizes="100vw"
        src={item.content.url}
      />
    </article>
  );
}

export function LandingTextCard({ item }: { item: ProfileTextBento }) {
  const textSurfaceStyle = normalizeGridTextSurfaceStyle(item.content.style);
  const backgroundColorOption = getBackgroundColorOption(textSurfaceStyle.backgroundColor);

  return (
    <article
      className={cn(
        "pointer-events-none relative flex size-full min-h-0 flex-col rounded-[1.5rem] p-3.5 shadow-float outline outline-border/35",
        backgroundColorOption.className
      )}
    >
      <div
        className={cn(
          "relative flex size-full min-h-0 overflow-y-auto overscroll-contain rounded-lg p-1",
          getVerticalAlignClassName(textSurfaceStyle.verticalAlign)
        )}
      >
        <p
          className={cn(
            "w-full break-all whitespace-pre-line text-lg! font-medium leading-relaxed",
            getTextAlignClassName(textSurfaceStyle.textAlign),
            backgroundColorOption.foregroundClassName
          )}
        >
          {item.content.content}
        </p>
      </div>
    </article>
  );
}

export const itemVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 18,
  },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.42,
      ease: [0.16, 1, 0.3, 1],
    },
    y: 0,
  },
};

export function getPlacementClassName(id: string) {
  switch (id) {
    case "showcase-map":
      return "left-[4%] top-[2%] min-[819px]:left-[7%] min-[819px]:top-[4%]";
    case "showcase-media":
      return "left-[18%] top-[28%] min-[819px]:left-[31%] min-[819px]:top-[12%]";
    case "showcase-text":
      return "right-[2%] top-[44%] min-[819px]:right-[8%] min-[819px]:top-[34%]";
    case "showcase-spotify":
      return "left-[7%] top-[56%] min-[819px]:left-[18%] min-[819px]:top-[50%]";
    case "showcase-youtube":
      return "right-[8%] top-[66%] min-[819px]:right-[18%] min-[819px]:top-[60%]";
    case "showcase-twitter":
      return "left-[38%] top-[78%] min-[819px]:left-[48%] min-[819px]:top-[74%]";
    default:
      return "";
  }
}

export const showcaseItems = [
  {
    content: {
      caption: "SoHo, New York",
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
      caption: "Night frame",
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
      caption: "Portrait frame",
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
    },
    id: "showcase-text",
    layout: { compact: { h: 2, w: 1, x: 0, y: 0 }, desktop: { h: 2, w: 1, x: 0, y: 0 } },
    type: "text",
  },
  {
    content: {
      description: null,
      favicon: null,
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
      favicon: null,
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
      favicon: null,
      domain: "x.com",
      thumbnail: null,
      title: "@Ethan_Vale",
      url: "https://x.com/",
    },
    id: "showcase-twitter",
    layout: { compact: { h: 2, w: 1, x: 0, y: 0 }, desktop: { h: 2, w: 1, x: 0, y: 0 } },
    type: "link",
  },
] as const;

export function LandingShowcaseItem({
  item,
  mobileHeight,
  mobileWidth,
  width,
  height,
}: {
  item: (typeof showcaseItems)[number];
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
        {item.type === "map" ? (
          <LandingMapCard item={item} />
        ) : item.type === "media" ? (
          <LandingMediaCard item={item} />
        ) : item.type === "text" ? (
          <LandingTextCard item={item} />
        ) : (
          <LandingLinkCard item={item} />
        )}
      </div>

      <div
        className="hidden shrink-0 min-[819px]:block"
        style={{
          height: `${height}px`,
          width: `${width}px`,
        }}
      >
        {item.type === "map" ? (
          <LandingMapCard item={item} />
        ) : item.type === "media" ? (
          <LandingMediaCard item={item} />
        ) : item.type === "text" ? (
          <LandingTextCard item={item} />
        ) : (
          <LandingLinkCard item={item} />
        )}
      </div>
    </>
  );
}
