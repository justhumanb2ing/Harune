import type { CSSProperties, HTMLAttributeReferrerPolicy, ReactNode } from "react";
import {
  ColorAppleMusicIcon,
  ColorSoundcloudIcon,
  ColorSpotifyIcon,
  ColorYoutubeIcon,
} from "@/components/icons";

export const playlistProviderLabels = {
  "Apple Music": "Apple Music - 웹 플레이어",
  SoundCloud: "SoundCloud",
  Spotify: "Spotify",
  YouTube: "YouTube",
} as const;

export const playlistProviderOrder = [
  "Spotify",
  "SoundCloud",
  "Apple Music - 웹 플레이어",
  "YouTube",
] as const;

export type PlaylistProvider = (typeof playlistProviderOrder)[number];

type IconProps = {
  className?: string;
  "aria-hidden"?: boolean;
};

type PlaylistIconComponent = (props: IconProps) => ReactNode;

export const playlistProviderIcons: Record<PlaylistProvider, PlaylistIconComponent> = {
  Spotify: ColorSpotifyIcon,
  SoundCloud: ColorSoundcloudIcon,
  "Apple Music - 웹 플레이어": ColorAppleMusicIcon,
  YouTube: ColorYoutubeIcon,
};

export const resolvePlaylistProvider = (
  site: string | undefined | null
): PlaylistProvider | null => {
  if (!site) {
    return null;
  }

  const normalizedSite = site.replace(/\s+/g, " ").trim();

  if (normalizedSite.includes("Apple Music")) {
    return "Apple Music - 웹 플레이어";
  }

  return playlistProviderLabels[normalizedSite as keyof typeof playlistProviderLabels] ?? null;
};

export type ParsedPlaylistIframe = {
  allow?: string;
  allowFullScreen?: boolean;
  loading?: "eager" | "lazy";
  referrerPolicy?: HTMLAttributeReferrerPolicy;
  sandbox?: string;
  src: string;
  style?: CSSProperties;
  title?: string;
};

const iframeTagPattern = /<iframe\b([^>]*)>(?:<\/iframe>)?/i;
const attributePattern = /([^\s=/>]+)(?:=(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g;

const parseStyleAttribute = (value: string) => {
  const styleEntries = value
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => part.split(":"))
    .filter((pair): pair is [string, string] => pair.length >= 2)
    .map(([key, rawValue]) => [key.trim(), rawValue.trim()] as const);

  if (styleEntries.length === 0) {
    return undefined;
  }

  return Object.fromEntries(styleEntries) as CSSProperties;
};

export function parsePlaylistIframe(content: string): ParsedPlaylistIframe | null {
  const match = content.match(iframeTagPattern);

  if (!match) {
    return null;
  }

  const [, attributeSource = ""] = match;
  const parsed: ParsedPlaylistIframe = {
    src: "",
  };

  for (const attributeMatch of attributeSource.matchAll(attributePattern)) {
    const [, name, doubleQuoted, singleQuoted, bare] = attributeMatch;
    const rawValue = doubleQuoted ?? singleQuoted ?? bare ?? "";
    const value = rawValue.trim();

    if (name === "src") {
      parsed.src = value;
      continue;
    }

    if (name === "allow") {
      parsed.allow = value;
      continue;
    }

    if (name === "title") {
      parsed.title = value;
      continue;
    }

    if (name === "loading" && (value === "lazy" || value === "eager")) {
      parsed.loading = value;
      continue;
    }

    if (name === "sandbox") {
      parsed.sandbox = value;
      continue;
    }

    if (name === "referrerpolicy") {
      parsed.referrerPolicy = value as HTMLAttributeReferrerPolicy;
      continue;
    }

    if (name === "style") {
      parsed.style = parseStyleAttribute(value);
      continue;
    }

    if (name.toLowerCase() === "allowfullscreen") {
      parsed.allowFullScreen = true;
    }
  }

  if (!parsed.src) {
    return null;
  }

  return parsed;
}
