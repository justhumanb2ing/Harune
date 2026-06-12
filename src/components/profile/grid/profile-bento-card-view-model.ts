import type { GridBreakpoint, ResizeOptionId } from "@/lib/grid/grid-types";
import {
  type LinkProviderTheme,
  resolveLinkProviderTheme,
} from "@/lib/metadata/link-provider-theme";
import {
  formatCompactCount,
  getSpotifyProviderEmbedUri,
  getYoutubeThumbnailUrl,
  isChzzkProviderMetadata,
  isDiscordProviderMetadata,
  isGithubContributionsProviderMetadata,
  isTwitchProviderMetadata,
  isYoutubeProviderMetadata,
  type NormalizedMetadata,
} from "@/lib/metadata/url-metadata";
import { normalizeClockWidgetConfig } from "@/lib/profile/clock";
import type { ProfileBentoItem, ProfileBentoType } from "@/lib/profile/types";

export type ProfileBentoLinkSize = ResizeOptionId;

export type ProfileBentoLinkSupportingPanel =
  | {
      kind: "github-contributions";
      metadata: NormalizedMetadata;
    }
  | {
      kind: "thumbnail";
      thumbnail: string | null;
    };

type ProfileBentoCardBaseViewModel<
  TType extends ProfileBentoType,
  TItem extends ProfileBentoItem,
> = {
  item: TItem;
  type: TType;
};

export type ProfileBentoLinkCardViewModel = ProfileBentoCardBaseViewModel<
  "link",
  Extract<ProfileBentoItem, { type: "link" }>
> & {
  layoutSize: ProfileBentoLinkSize;
  providerActionLabel: string;
  providerTheme: LinkProviderTheme | null;
  spotifyEmbedUri: string | null;
  supportingPanel: ProfileBentoLinkSupportingPanel;
};

export type ProfileBentoTextCardViewModel = ProfileBentoCardBaseViewModel<
  "text",
  Extract<ProfileBentoItem, { type: "text" }>
>;

export type ProfileBentoSectionCardViewModel = ProfileBentoCardBaseViewModel<
  "section",
  Extract<ProfileBentoItem, { type: "section" }>
>;

export type ProfileBentoMediaCardViewModel = ProfileBentoCardBaseViewModel<
  "media",
  Extract<ProfileBentoItem, { type: "media" }>
>;

export type ProfileBentoMapCardViewModel = ProfileBentoCardBaseViewModel<
  "map",
  Extract<ProfileBentoItem, { type: "map" }>
>;

export type ProfileBentoClockCardViewModel = ProfileBentoCardBaseViewModel<
  "clock",
  Extract<ProfileBentoItem, { type: "clock" }>
> & {
  backgroundColor: string;
  content: ReturnType<typeof normalizeClockWidgetConfig>;
  timezoneLabel: string;
  typographyClassName: string;
};

export type ProfileBentoCardViewModel =
  | ProfileBentoLinkCardViewModel
  | ProfileBentoTextCardViewModel
  | ProfileBentoSectionCardViewModel
  | ProfileBentoMediaCardViewModel
  | ProfileBentoMapCardViewModel
  | ProfileBentoClockCardViewModel;

export function getProfileBentoLinkSize(w: number, h: number): ProfileBentoLinkSize {
  if (w === 2 && h === 1) {
    return "2x1";
  }

  if (w === 2 && h === 2) {
    return "2x2";
  }

  if (w === 2 && h === 4) {
    return "2x4";
  }

  if (w === 1 && h === 4) {
    return "1x4";
  }

  return "1x2";
}

export function createProfileBentoCardViewModel({
  activeBreakpoint = "desktop",
  item,
  layoutSize,
}: {
  activeBreakpoint?: GridBreakpoint;
  item: ProfileBentoItem;
  layoutSize?: ProfileBentoLinkSize;
}): ProfileBentoCardViewModel {
  if (item.type === "link") {
    return createLinkCardViewModel({ activeBreakpoint, item, layoutSize });
  }

  if (item.type === "clock") {
    return createClockCardViewModel({ activeBreakpoint, item });
  }

  return {
    item,
    type: item.type,
  } as ProfileBentoCardViewModel;
}

function createLinkCardViewModel({
  activeBreakpoint,
  item,
  layoutSize,
}: {
  activeBreakpoint: GridBreakpoint;
  item: Extract<ProfileBentoItem, { type: "link" }>;
  layoutSize?: ProfileBentoLinkSize;
}): ProfileBentoLinkCardViewModel {
  const activeLayout = item.layout[activeBreakpoint];
  const providerTheme = resolveLinkProviderTheme(item.content.url);
  const providerMetadata = getLinkProviderMetadata(item);

  return {
    item,
    layoutSize: layoutSize ?? getProfileBentoLinkSize(activeLayout.w, activeLayout.h),
    providerActionLabel: getLinkProviderActionLabel(providerTheme, providerMetadata),
    providerTheme,
    spotifyEmbedUri: getSpotifyProviderEmbedUri(providerMetadata),
    supportingPanel: getLinkSupportingPanel(item, providerTheme, providerMetadata),
    type: "link",
  };
}

function createClockCardViewModel({
  activeBreakpoint,
  item,
}: {
  activeBreakpoint: GridBreakpoint;
  item: Extract<ProfileBentoItem, { type: "clock" }>;
}): ProfileBentoClockCardViewModel {
  const layout = item.layout[activeBreakpoint];
  const content = { ...normalizeClockWidgetConfig(item.content), showSeconds: true };
  const timezone = content.timezone ?? content.timeZone ?? "";

  return {
    backgroundColor: content.style.backgroundColor,
    content,
    item,
    timezoneLabel: getClockTimezoneLabel(timezone),
    typographyClassName: getClockTypographyClassName(layout.w, layout.h),
    type: "clock",
  };
}

function getLinkProviderMetadata(item: Extract<ProfileBentoItem, { type: "link" }>) {
  return item.content.metadata?.providerMetadata ?? null;
}

function getLinkProviderActionLabel(
  providerTheme: LinkProviderTheme | null,
  providerMetadata: NormalizedMetadata["providerMetadata"]
): string {
  if (!providerTheme) {
    return "";
  }

  if (providerTheme.provider === "youtube" && isYoutubeProviderMetadata(providerMetadata)) {
    const subscriberCount = formatCompactCount(providerMetadata.payload.statistics.subscriberCount);

    return subscriberCount
      ? `${providerTheme.actionLabel} ${subscriberCount}`
      : providerTheme.actionLabel;
  }

  if (providerTheme.provider === "discord" && isDiscordProviderMetadata(providerMetadata)) {
    const memberCount = formatCompactCount(providerMetadata.payload.memberCount);

    return memberCount ? `${providerTheme.actionLabel} ${memberCount}` : providerTheme.actionLabel;
  }

  if (providerTheme.provider === "twitch" && isTwitchProviderMetadata(providerMetadata)) {
    const followerCount = formatCompactCount(providerMetadata.payload.followerCount);

    return followerCount
      ? `${providerTheme.actionLabel} ${followerCount}`
      : providerTheme.actionLabel;
  }

  if (providerTheme.provider === "chzzk" && isChzzkProviderMetadata(providerMetadata)) {
    const followerCount = formatCompactCount(providerMetadata.payload.followerCount);

    return followerCount
      ? `${providerTheme.actionLabel} ${followerCount}`
      : providerTheme.actionLabel;
  }

  return providerTheme.actionLabel;
}

function getLinkSupportingPanel(
  item: Extract<ProfileBentoItem, { type: "link" }>,
  providerTheme: LinkProviderTheme | null,
  providerMetadata: NormalizedMetadata["providerMetadata"]
): ProfileBentoLinkSupportingPanel {
  const metadata = item.content.metadata ?? null;

  if (
    providerTheme?.provider === "github" &&
    metadata &&
    isGithubContributionsProviderMetadata(providerMetadata)
  ) {
    return {
      kind: "github-contributions",
      metadata,
    };
  }

  return {
    kind: "thumbnail",
    thumbnail: getLinkSupportingThumbnail(item, providerTheme, providerMetadata),
  };
}

function getLinkSupportingThumbnail(
  item: Extract<ProfileBentoItem, { type: "link" }>,
  providerTheme: LinkProviderTheme | null,
  providerMetadata: NormalizedMetadata["providerMetadata"]
) {
  if (providerTheme?.provider === "youtube" && isYoutubeProviderMetadata(providerMetadata)) {
    return getYoutubeThumbnailUrl(providerMetadata.payload);
  }

  return item.content.thumbnail;
}

function getClockTimezoneLabel(timezone: string) {
  const labelByTimezone: Record<string, string> = {
    "America/Los_Angeles": "Los Angeles",
    "America/New_York": "New York",
    "Asia/Seoul": "Seoul",
    "Asia/Shanghai": "Shanghai",
    "Asia/Singapore": "Singapore",
    "Asia/Tokyo": "Tokyo",
    "Australia/Sydney": "Sydney",
    "Europe/London": "London",
    "Europe/Paris": "Paris",
    UTC: "UTC",
  };

  return labelByTimezone[timezone] ?? timezone.split("/").pop() ?? timezone;
}

function getClockTypographyClassName(w: number, h: number) {
  if (w >= 4 || h >= 4) {
    return "text-[clamp(2rem,4vw,3.6rem)]";
  }

  if (w >= 3 || h >= 3) {
    return "text-[clamp(1.75rem,3.4vw,2.8rem)]";
  }

  if (w === 1) {
    return "text-[clamp(1rem,2.4vw,1.3rem)]";
  }

  return "text-[clamp(1.35rem,2.8vw,2rem)]";
}
