import type { SocialPlatform } from "@/lib/profile-page/types";

export const PROFILE_PAGE_ANALYTICS_PATH_PREFIX = "/_analytics/profile-page";

export const PROFILE_PAGE_ANALYTICS_EVENT_NAMES = {
  pageView: "profile-page-view",
  socialClick: "profile-social-click",
  linkClick: "profile-link-click",
} as const;

export type ProfilePageAnalyticsEventName =
  (typeof PROFILE_PAGE_ANALYTICS_EVENT_NAMES)[keyof typeof PROFILE_PAGE_ANALYTICS_EVENT_NAMES];

export type ProfilePageAnalyticsItemKind = "social" | "link";

type PrimitiveEventValue = string | number | boolean;

type ProfilePageAnalyticsEventData = Record<string, PrimitiveEventValue | undefined>;

type UmamiPayload = {
  data?: Record<string, unknown>;
  name?: string;
  title?: string;
  url?: string;
  website?: string;
};

type UmamiPayloadBuilder = (payload: UmamiPayload) => UmamiPayload;

type UmamiTracker = {
  track: {
    (payload: UmamiPayload | UmamiPayloadBuilder): void;
    (eventName: string, data?: Record<string, PrimitiveEventValue>): void;
  };
};

declare global {
  interface Window {
    umami?: UmamiTracker;
  }
}

export const buildProfilePageAnalyticsPath = (profilePageId: string) =>
  `${PROFILE_PAGE_ANALYTICS_PATH_PREFIX}/${profilePageId}`;

const compactEventData = (data: ProfilePageAnalyticsEventData) =>
  Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined)) as Record<
    string,
    PrimitiveEventValue
  >;

const getUmamiTracker = () => {
  if (typeof window === "undefined") {
    return null;
  }

  return window.umami ?? null;
};

type TrackProfilePageAnalyticsEventParams = {
  data?: ProfilePageAnalyticsEventData;
  eventName: ProfilePageAnalyticsEventName;
  profilePageId: string;
  title?: string;
};

export const trackProfilePageAnalyticsEvent = ({
  data,
  eventName,
  profilePageId,
  title,
}: TrackProfilePageAnalyticsEventParams) => {
  const tracker = getUmamiTracker();

  if (!tracker) {
    return false;
  }

  const analyticsPath = buildProfilePageAnalyticsPath(profilePageId);
  const compactedData = compactEventData(data ?? {});

  tracker.track((payload) => ({
    ...payload,
    data: compactedData,
    name: eventName,
    title: title ?? payload.title,
    url: analyticsPath,
  }));

  return true;
};

type TrackProfilePagePageViewParams = {
  displayName: string;
  handle: string;
  profilePageId: string;
};

export const trackProfilePagePageView = ({
  displayName,
  handle,
  profilePageId,
}: TrackProfilePagePageViewParams) =>
  trackProfilePageAnalyticsEvent({
    data: {
      displayName,
      handle,
      profilePageId,
    },
    eventName: PROFILE_PAGE_ANALYTICS_EVENT_NAMES.pageView,
    profilePageId,
    title: `${displayName} on Leeve`,
  });

type TrackProfilePageItemClickParams = {
  href: string;
  itemId: string;
  itemKind: ProfilePageAnalyticsItemKind;
  itemLabel: string;
  platform?: SocialPlatform;
  profilePageId: string;
};

export const trackProfilePageItemClick = ({
  href,
  itemId,
  itemKind,
  itemLabel,
  platform,
  profilePageId,
}: TrackProfilePageItemClickParams) =>
  trackProfilePageAnalyticsEvent({
    data: {
      destination: href,
      itemId,
      itemKind,
      itemLabel,
      platform,
      profilePageId,
    },
    eventName:
      itemKind === "social"
        ? PROFILE_PAGE_ANALYTICS_EVENT_NAMES.socialClick
        : PROFILE_PAGE_ANALYTICS_EVENT_NAMES.linkClick,
    profilePageId,
  });
