import type { GridItemTheme } from "@/lib/grid/grid-types";

export type LinkProviderTheme = GridItemTheme & {
  actionBackgroundColor: string;
  actionForegroundColor: "#000000" | "#ffffff";
  actionLabel: string;
  provider: string;
};

type LinkProviderThemeEntry = {
  actionForegroundColor?: "#000000" | "#ffffff";
  actionLabel: string;
  provider: string;
  color: `#${string}`;
  pastelColor: `#${string}`;
  hosts: readonly string[];
};

const linkProviderThemeEntries = [
  {
    provider: "youtube",
    actionForegroundColor: "#ffffff",
    actionLabel: "Subscribe",
    color: "#ff0033",
    pastelColor: "#fff2f5",
    hosts: ["youtube.com", "youtu.be"],
  },
  {
    provider: "github",
    actionLabel: "Follow",
    color: "#000000",
    pastelColor: "#ffffff",
    hosts: ["github.com"],
  },
  {
    provider: "x",
    actionLabel: "Follow",
    color: "#000000",
    pastelColor: "#f7f7f7",
    hosts: ["x.com", "twitter.com"],
  },
  {
    provider: "spotify",
    actionForegroundColor: "#ffffff",
    actionLabel: "Play",
    color: "#1ED760",
    pastelColor: "#f0fbf4",
    hosts: ["spotify.com", "open.spotify.com"],
  },
  {
    provider: "threads",
    actionLabel: "Follow",
    color: "#000000",
    pastelColor: "#ffffff",
    hosts: ["threads.com", "threads.net"],
  },
  {
    provider: "instagram",
    actionForegroundColor: "#ffffff",
    actionLabel: "Follow",
    color: "#3797f0",
    pastelColor: "#ffffff",
    hosts: ["instagram.com"],
  },
  {
    provider: "buymeacoffee",
    actionLabel: "Support",
    color: "#ffdd00",
    pastelColor: "#fffbe5",
    hosts: ["buymeacoffee.com"],
  },
  {
    provider: "linkedin",
    actionLabel: "Connect",
    color: "#0a66c2",
    pastelColor: "#f0f7ff",
    hosts: ["linkedin.com"],
  },
  {
    provider: "chzzk",
    actionLabel: "Watch",
    color: "#000000",
    pastelColor: "#ffffff",
    hosts: ["chzzk.naver.com"],
  },
  {
    provider: "figma",
    actionLabel: "Open",
    color: "#1769ff",
    pastelColor: "#ffffff",
    hosts: ["figma.com"],
  },
  {
    provider: "kofi",
    actionForegroundColor: "#ffffff",
    actionLabel: "Support",
    color: "#29abe0",
    pastelColor: "#eefaff",
    hosts: ["ko-fi.com", "kofi.com"],
  },
  {
    provider: "gumroad",
    actionLabel: "Get it",
    color: "#ff90e8",
    pastelColor: "#fff2fc",
    hosts: ["gumroad.com"],
  },
  {
    provider: "medium",
    actionLabel: "Read",
    color: "#000000",
    pastelColor: "#ffffff",
    hosts: ["medium.com"],
  },
  {
    provider: "patreon",
    actionForegroundColor: "#ffffff",
    actionLabel: "Join",
    color: "#71a0ff",
    pastelColor: "#ffffff",
    hosts: ["patreon.com"],
  },
  {
    provider: "producthunt",
    actionForegroundColor: "#ffffff",
    actionLabel: "View",
    color: "#da552f",
    pastelColor: "#fff4f0",
    hosts: ["producthunt.com"],
  },
  {
    provider: "reddit",
    actionForegroundColor: "#ffffff",
    actionLabel: "Join",
    color: "#ff4500",
    pastelColor: "#fff2ed",
    hosts: ["reddit.com", "redd.it"],
  },
  {
    provider: "tiktok",
    actionLabel: "Watch",
    color: "#000000",
    pastelColor: "#ffffff",
    hosts: ["tiktok.com"],
  },
  {
    provider: "twitch",
    actionLabel: "Watch",
    color: "#9146ff",
    pastelColor: "#f7f2ff",
    hosts: ["twitch.tv"],
  },
  {
    provider: "behance",
    actionLabel: "Follow",
    color: "#1769ff",
    pastelColor: "#f0f5ff",
    hosts: ["behance.net"],
  },
  {
    provider: "dribbble",
    actionForegroundColor: "#ffffff",
    actionLabel: "Follow",
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

function getRelativeLuminance(hexColor: `#${string}`) {
  const normalizedHex = hexColor.slice(1);
  const [red, green, blue] = [0, 2, 4].map((start) =>
    Number.parseInt(normalizedHex.slice(start, start + 2), 16)
  );

  const [linearRed, linearGreen, linearBlue] = [red, green, blue].map((channel) => {
    const normalizedChannel = channel / 255;

    return normalizedChannel <= 0.03928
      ? normalizedChannel / 12.92
      : ((normalizedChannel + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * linearRed + 0.7152 * linearGreen + 0.0722 * linearBlue;
}

function getBestReadableTextColor(backgroundColor: `#${string}`): "#000000" | "#ffffff" {
  const luminance = getRelativeLuminance(backgroundColor);
  const contrastWithBlack = (luminance + 0.05) / 0.05;
  const contrastWithWhite = 1.05 / (luminance + 0.05);

  return contrastWithBlack >= contrastWithWhite ? "#000000" : "#ffffff";
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
    actionBackgroundColor: entry.color,
    actionForegroundColor:
      "actionForegroundColor" in entry
        ? entry.actionForegroundColor
        : getBestReadableTextColor(entry.color),
    actionLabel: entry.actionLabel,
    provider: entry.provider,
    ...createGridItemTheme(entry.pastelColor),
  };
}
