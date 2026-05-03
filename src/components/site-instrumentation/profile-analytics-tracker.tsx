"use client";

import type * as React from "react";
import { useEffect } from "react";
import {
  type ProfilePageAnalyticsItemKind,
  trackProfilePageItemClick,
  trackProfilePagePageView,
} from "@/lib/analytics/profile";
import type { SocialPlatform } from "@/lib/profile/types";

const PAGE_VIEW_DEDUP_WINDOW_MS = 1000;

type ProfilePageAnalyticsTrackerProps = {
  displayName: string;
  handle: string;
  profilePageId: string;
};

const shouldSendPageView = (profilePageId: string) => {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    const storageKey = `profile-analytics:view:${profilePageId}`;
    const now = Date.now();
    const lastSentAt = Number(window.sessionStorage.getItem(storageKey) ?? "0");

    if (lastSentAt > 0 && now - lastSentAt < PAGE_VIEW_DEDUP_WINDOW_MS) {
      return false;
    }

    window.sessionStorage.setItem(storageKey, String(now));
  } catch {
    return true;
  }

  return true;
};

export function ProfilePageAnalyticsTracker({
  displayName,
  handle,
  profilePageId,
}: ProfilePageAnalyticsTrackerProps) {
  useEffect(() => {
    if (!shouldSendPageView(profilePageId)) {
      return;
    }

    trackProfilePagePageView({
      displayName,
      handle,
      profilePageId,
    });
  }, [displayName, handle, profilePageId]);

  return null;
}

type TrackedProfilePageLinkProps = Omit<React.ComponentProps<"a">, "href"> & {
  href: string;
  itemId: string;
  itemKind: ProfilePageAnalyticsItemKind;
  itemLabel: string;
  platform?: SocialPlatform;
  profilePageId: string;
};

export function TrackedProfilePageLink({
  href,
  itemId,
  itemKind,
  itemLabel,
  onClick,
  platform,
  profilePageId,
  ...props
}: TrackedProfilePageLinkProps) {
  return (
    <a
      {...props}
      href={href}
      onClick={(event) => {
        onClick?.(event);

        if (event.defaultPrevented) {
          return;
        }

        trackProfilePageItemClick({
          href,
          itemId,
          itemKind,
          itemLabel,
          platform,
          profilePageId,
        });
      }}
    />
  );
}
