"use client";

import type { CSSProperties, ReactNode } from "react";
import { useEffect, useState } from "react";
import {
  getProfileBentoLinkSize,
  ProfileBentoGridCard,
} from "@/components/profile/grid/profile-bento-grid-card";
import { toBentoGridItem } from "@/components/profile/grid/profile-bento-grid-model";
import type { GridItem } from "@/lib/grid/grid-types";
import type { ProfileBentoItem } from "@/lib/profile/types";
import { cn } from "@/lib/utils";

const providerIconBaseUrl = "https://cdn.harune.me/public/assets/link-provider-icon";

type ProviderCardGridItemStyle = CSSProperties & {
  "--compact-grid-column": string;
  "--compact-grid-row": string;
  "--desktop-grid-column": string;
  "--desktop-grid-row": string;
};

type ProviderCardShellStyle = CSSProperties & {
  [key: `--${string}`]: string | number | undefined;
  "--grid-card-control-background"?: string;
  "--grid-card-muted-foreground"?: string;
  "--tw-inset-ring-color"?: string;
};

const providerCardItems = [
  {
    id: "provider-card-youtube",
    type: "link",
    layout: {
      desktop: { x: 1, y: 0, w: 2, h: 2 },
      compact: { x: 0, y: 0, w: 2, h: 2 },
    },
    content: {
      title: "Earth at Night",
      description: "NASA public domain video",
      favicon: `${providerIconBaseUrl}/youtube.svg`,
      domain: "youtube.com",
      thumbnail: "https://i.ytimg.com/vi/8dc58ZrOuck/hqdefault.jpg",
      url: "https://www.youtube.com/watch?v=8dc58ZrOuck",
      metadata: null,
    },
  },
  {
    id: "provider-card-spotify",
    type: "link",
    layout: {
      desktop: { x: 3, y: 0, w: 2, h: 2 },
      compact: { x: 0, y: 2, w: 2, h: 2 },
    },
    content: {
      title: "Today's Top Hits",
      description: "Current rotation",
      favicon: `${providerIconBaseUrl}/spotify.svg`,
      domain: "spotify.com",
      thumbnail: "https://i.scdn.co/image/ab67706f0000000201015bcb71e8768c005b0613",
      url: "https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M",
      metadata: null,
    },
  },
  {
    id: "provider-card-github",
    type: "link",
    layout: {
      desktop: { x: 1, y: 2, w: 1, h: 2 },
      compact: { x: 0, y: 4, w: 1, h: 2 },
    },
    content: {
      title: "Open Source Lab",
      description: null,
      favicon: `${providerIconBaseUrl}/github.svg`,
      domain: "github.com",
      thumbnail: null,
      url: "https://github.com/octocat",
      metadata: null,
    },
  },
  {
    id: "provider-card-discord",
    type: "link",
    layout: {
      desktop: { x: 2, y: 2, w: 1, h: 2 },
      compact: { x: 1, y: 4, w: 1, h: 2 },
    },
    content: {
      title: "Creator Club",
      description: null,
      favicon: `${providerIconBaseUrl}/discord.svg`,
      domain: "discord.gg",
      thumbnail: null,
      url: "https://discord.gg/example",
      metadata: {
        url: "https://discord.gg/example",
        domain: "discord.gg",
        title: "Creator Club",
        description: "A friendly creator community",
        image: "https://cdn.discordapp.com/icons/123456789012345678/guild_icon.png?size=256",
        siteName: "Discord",
        favicon: `${providerIconBaseUrl}/discord.svg`,
        provider: "discord",
        providerMetadata: {
          provider: "discord",
          viewType: "discord_invite",
          fetchedAt: "2026-06-23T00:00:00.000Z",
          payload: {
            code: "example",
            guildId: "123456789012345678",
            guildName: "Creator Club",
            guildDescription: "A friendly creator community",
            iconUrl: "https://cdn.discordapp.com/icons/123456789012345678/guild_icon.png?size=256",
            memberCount: 12345,
            presenceCount: 321,
          },
        },
      },
    },
  },
  {
    id: "provider-card-chzzk",
    type: "link",
    layout: {
      desktop: { x: 5, y: 7, w: 1, h: 2 },
      compact: { x: 0, y: 21, w: 2, h: 1 },
    },
    content: {
      title: "Creator Live",
      description: null,
      favicon: `${providerIconBaseUrl}/chzzk.svg`,
      domain: "chzzk.naver.com",
      thumbnail: null,
      url: "https://chzzk.naver.com/75cbf189b3bb8f9f687d2aca0d0a382b",
      metadata: {
        url: "https://chzzk.naver.com/75cbf189b3bb8f9f687d2aca0d0a382b",
        domain: "chzzk.naver.com",
        title: "Creator Live",
        description: "CHZZK channel",
        image: "https://nng-phinf.pstatic.net/channel.png",
        siteName: "CHZZK",
        favicon: `${providerIconBaseUrl}/chzzk.svg`,
        provider: "chzzk",
        providerMetadata: {
          provider: "chzzk",
          viewType: "chzzk_channel",
          fetchedAt: "2026-06-23T00:00:00.000Z",
          payload: {
            channelId: "75cbf189b3bb8f9f687d2aca0d0a382b",
            channelName: "Creator Live",
            channelImageUrl: "https://nng-phinf.pstatic.net/channel.png",
            followerCount: 374700,
            verifiedMark: true,
          },
        },
      },
    },
  },
  {
    id: "provider-card-twitch",
    type: "link",
    layout: {
      desktop: { x: 3, y: 2, w: 2, h: 1 },
      compact: { x: 0, y: 6, w: 2, h: 1 },
    },
    content: {
      title: "Live Workshop",
      description: null,
      favicon: `${providerIconBaseUrl}/twitch.svg`,
      domain: "twitch.tv",
      thumbnail: null,
      url: "https://www.twitch.tv/twitch",
      metadata: null,
    },
  },
  {
    id: "provider-card-map",
    type: "map",
    layout: {
      desktop: { x: 3, y: 3, w: 2, h: 4 },
      compact: { x: 0, y: 7, w: 2, h: 4 },
    },
    content: {
      latitude: 40.7128,
      longitude: -74.006,
      zoom: 12,
      caption: "New York",
      url: "https://maps.google.com/?q=40.7128,-74.006",
    },
  },
  {
    id: "provider-card-image",
    type: "media",
    layout: {
      desktop: { x: 1, y: 4, w: 2, h: 4 },
      compact: { x: 0, y: 11, w: 2, h: 4 },
    },
    content: {
      mediaType: "image",
      url: "https://cdn.harune.me/public/assets/landing-example-card.jpg",
      objectKey: "",
      href: null,
      alt: "Studio preview image",
      caption: "",
    },
  },
  {
    id: "provider-card-x",
    type: "link",
    layout: {
      desktop: { x: 0, y: 1, w: 1, h: 2 },
      compact: { x: 1, y: 15, w: 1, h: 2 },
    },
    content: {
      title: "Daily Dispatch",
      description: null,
      favicon: `${providerIconBaseUrl}/x.svg`,
      domain: "x.com",
      thumbnail: null,
      url: "https://x.com/harune",
      metadata: null,
    },
  },
  {
    id: "provider-card-instagram",
    type: "link",
    layout: {
      desktop: { x: 5, y: 1, w: 1, h: 2 },
      compact: { x: 1, y: 17, w: 1, h: 2 },
    },
    content: {
      title: "Visual Diary",
      description: null,
      favicon: `${providerIconBaseUrl}/instagram.svg`,
      domain: "instagram.com",
      thumbnail: null,
      url: "https://www.instagram.com/harune",
      metadata: null,
    },
  },
  {
    id: "provider-card-side-image",
    type: "media",
    layout: {
      desktop: { x: 0, y: 3, w: 1, h: 4 },
      compact: { x: 0, y: 15, w: 1, h: 4 },
    },
    content: {
      mediaType: "image",
      url: "https://i.pinimg.com/webp85/1200x/d4/8f/56/d48f565ba8c0b37be827eeff2865806d.webp",
      objectKey: "",
      href: null,
      alt: "Landing card preview image",
      caption: "",
    },
  },
  {
    id: "provider-card-right-image",
    type: "media",
    layout: {
      desktop: { x: 5, y: 3, w: 1, h: 4 },
      compact: { x: 0, y: 19, w: 2, h: 2 },
    },
    content: {
      mediaType: "image",
      url: "https://i.pinimg.com/736x/66/ff/cd/66ffcd4ce308849ca2867a999720f513.jpg",
      objectKey: "",
      href: null,
      alt: "Landing card visual preview",
      caption: "",
    },
  },
] satisfies ProfileBentoItem[];

function getGridPositionStyle(item: ProfileBentoItem, breakpoint: "compact" | "desktop") {
  const layout = item.layout[breakpoint];

  return {
    column: `${layout.x + 1} / span ${layout.w}`,
    row: `${layout.y + 1} / span ${layout.h}`,
  };
}

function ProviderCardShell({ children, gridItem }: { children: ReactNode; gridItem: GridItem }) {
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
      style={shellStyle satisfies ProviderCardShellStyle}
    >
      <div className="min-h-0 flex-1">{children}</div>
    </article>
  );
}

function useProviderCardGridBreakpoint() {
  const [breakpoint, setBreakpoint] = useState<"compact" | "desktop">("compact");

  useEffect(() => {
    const query = window.matchMedia("(min-width: 1280px)");
    const updateBreakpoint = () => {
      setBreakpoint(query.matches ? "desktop" : "compact");
    };

    updateBreakpoint();
    query.addEventListener("change", updateBreakpoint);

    return () => {
      query.removeEventListener("change", updateBreakpoint);
    };
  }, []);

  return breakpoint;
}

function ProviderCardGridItem({
  activeBreakpoint,
  item,
}: {
  activeBreakpoint: "compact" | "desktop";
  item: ProfileBentoItem;
}) {
  const gridItem = toBentoGridItem(item);
  const compactPosition = getGridPositionStyle(item, "compact");
  const desktopPosition = getGridPositionStyle(item, "desktop");
  const itemStyle: ProviderCardGridItemStyle = {
    "--compact-grid-column": compactPosition.column,
    "--compact-grid-row": compactPosition.row,
    "--desktop-grid-column": desktopPosition.column,
    "--desktop-grid-row": desktopPosition.row,
  };

  return (
    <li
      className="relative min-w-0 overflow-visible rounded-[1.5rem] [grid-column:var(--compact-grid-column)] [grid-row:var(--compact-grid-row)] xl:[grid-column:var(--desktop-grid-column)] xl:[grid-row:var(--desktop-grid-row)]"
      style={itemStyle}
    >
      <ProviderCardShell gridItem={gridItem}>
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
      </ProviderCardShell>
    </li>
  );
}

export default function ProviderCardSection() {
  const activeBreakpoint = useProviderCardGridBreakpoint();

  return (
    <section className="overflow-hidden px-4 py-20 md:py-28">
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center gap-16">
        <header className="flex flex-col gap-3 items-center">
          <h2 className="max-w-4xl text-balance text-center font-bold text-3xl leading-tight tracking-normal md:text-5xl">
            Beautiful Cards, On Air
            <span className="text-indigo-400">.</span>
          </h2>
          <p className="text-xl font-normal md:text-2xl">Map, Image, Video, Link, Text are ready!</p>
        </header>
        
        <ul
          aria-label="Provider card examples"
          className="grid w-[360px] max-w-full auto-rows-[var(--provider-card-grid-row-height)] grid-cols-2 gap-5 [--provider-card-grid-row-height:calc(((var(--provider-card-grid-width)-20px)/2-20px)/2)] [--provider-card-grid-width:360px] sm:w-[400px] sm:[--provider-card-grid-width:400px] xl:w-full xl:max-w-7xl xl:grid-cols-6 xl:gap-10 xl:[--provider-card-grid-row-height:calc(((1280px-200px)/6-40px)/2)] xl:[--provider-card-grid-width:1280px]"
        >
          {providerCardItems.map((item) => (
            <ProviderCardGridItem activeBreakpoint={activeBreakpoint} item={item} key={item.id} />
          ))}
        </ul>
      </div>
    </section>
  );
}
