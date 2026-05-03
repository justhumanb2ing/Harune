import type { GridItemTheme } from "@/lib/grid/grid-types";

export type LinkProviderTheme = GridItemTheme & {
  provider: string;
};

type LinkProviderThemeEntry = {
  provider: string;
  color: `#${string}`;
  pastelColor: `#${string}`;
  hosts: readonly string[];
};

const linkProviderThemeEntries = [
  {
    provider: "youtube",
    color: "#ff0033",
    pastelColor: "#fff2f5",
    hosts: ["youtube.com", "youtu.be"],
  },
  { provider: "github", color: "#181717", pastelColor: "#f6f6f6", hosts: ["github.com"] },
  { provider: "x", color: "#000000", pastelColor: "#f7f7f7", hosts: ["x.com", "twitter.com"] },
  {
    provider: "spotify",
    color: "#1db954",
    pastelColor: "#f0fbf4",
    hosts: ["spotify.com", "open.spotify.com"],
  },
  { provider: "threads", color: "#000000", pastelColor: "#f7f7f7", hosts: ["threads.net"] },
  {
    provider: "instagram",
    color: "#e4405f",
    pastelColor: "#fff1f5",
    hosts: ["instagram.com"],
  },
  {
    provider: "buymeacoffee",
    color: "#ffdd00",
    pastelColor: "#fffbe5",
    hosts: ["buymeacoffee.com"],
  },
  { provider: "linkedin", color: "#0a66c2", pastelColor: "#f0f7ff", hosts: ["linkedin.com"] },
  {
    provider: "chzzk",
    color: "#00ffa3",
    pastelColor: "#effff9",
    hosts: ["chzzk.naver.com"],
  },
  { provider: "figma", color: "#a259ff", pastelColor: "#f7f2ff", hosts: ["figma.com"] },
  {
    provider: "kofi",
    color: "#29abe0",
    pastelColor: "#eefaff",
    hosts: ["ko-fi.com", "kofi.com"],
  },
  { provider: "gumroad", color: "#ff90e8", pastelColor: "#fff2fc", hosts: ["gumroad.com"] },
  { provider: "medium", color: "#000000", pastelColor: "#f7f7f7", hosts: ["medium.com"] },
  { provider: "patreon", color: "#ff424d", pastelColor: "#fff1f2", hosts: ["patreon.com"] },
  {
    provider: "producthunt",
    color: "#da552f",
    pastelColor: "#fff4f0",
    hosts: ["producthunt.com"],
  },
  {
    provider: "reddit",
    color: "#ff4500",
    pastelColor: "#fff2ed",
    hosts: ["reddit.com", "redd.it"],
  },
  { provider: "tiktok", color: "#000000", pastelColor: "#f7f7f7", hosts: ["tiktok.com"] },
  { provider: "twitch", color: "#9146ff", pastelColor: "#f7f2ff", hosts: ["twitch.tv"] },
  { provider: "behance", color: "#1769ff", pastelColor: "#f0f5ff", hosts: ["behance.net"] },
  {
    provider: "dribbble",
    color: "#ea4c89",
    pastelColor: "#fff2f7",
    hosts: ["dribbble.com", "dribble.com"],
  },
] as const satisfies readonly LinkProviderThemeEntry[];

function normalizeHostname(hostname: string) {
  return hostname.toLowerCase().replace(/^www\./, "");
}

function isHostnameMatch(hostname: string, providerHost: string) {
  return hostname === providerHost || hostname.endsWith(`.${providerHost}`);
}

function createGridItemTheme(color: `#${string}`): GridItemTheme {
  return {
    backgroundColor: color,
    foregroundColor: "#111111",
    mutedForegroundColor: "rgba(17, 17, 17, 0.62)",
    controlBackgroundColor: "rgba(17, 17, 17, 0.07)",
  };
}

export function resolveLinkProviderTheme(url: string): LinkProviderTheme | null {
  let hostname: string;

  try {
    hostname = normalizeHostname(new URL(url).hostname);
  } catch {
    return null;
  }

  const entry = linkProviderThemeEntries.find((themeEntry) =>
    themeEntry.hosts.some((host) => isHostnameMatch(hostname, host))
  );

  if (!entry) {
    return null;
  }

  return {
    provider: entry.provider,
    ...createGridItemTheme(entry.pastelColor),
  };
}
