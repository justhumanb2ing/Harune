import { describe, expect, test } from "bun:test";

import {
  buildProfilePageAnalyticsPath,
  PROFILE_PAGE_ANALYTICS_EVENT_NAMES,
  trackProfilePageItemClick,
  trackProfilePagePageView,
} from "@/lib/analytics/profile";

const setTestWindow = (value: unknown) => {
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value,
    writable: true,
  });
};

describe("profile page analytics", () => {
  test("builds a stable analytics path from profile page id", () => {
    expect(buildProfilePageAnalyticsPath("page-123")).toBe("/_analytics/profile/page-123");
  });

  test("tracks page views with stable path and page snapshot data", () => {
    const originalWindow = globalThis.window;
    const trackCalls: unknown[] = [];

    setTestWindow({
      umami: {
        track: (payload: unknown) => {
          trackCalls.push(payload);
        },
      },
    });

    try {
      const tracked = trackProfilePagePageView({
        displayName: "Leeve",
        handle: "leeve",
        profilePageId: "page-1",
      });

      expect(tracked).toBe(true);
      expect(trackCalls).toHaveLength(1);

      const payloadFactory = trackCalls[0] as (payload: { title?: string; url?: string }) => {
        data: Record<string, unknown>;
        name: string;
        title: string;
        url: string;
      };

      expect(
        payloadFactory({
          title: "Original title",
          url: "/leeve",
        })
      ).toEqual({
        data: {
          displayName: "Leeve",
          handle: "leeve",
          profilePageId: "page-1",
        },
        name: PROFILE_PAGE_ANALYTICS_EVENT_NAMES.pageView,
        title: "Leeve on Harune",
        url: "/_analytics/profile/page-1",
      });
    } finally {
      setTestWindow(originalWindow);
    }
  });

  test("tracks item clicks with event data that survives item deletion", () => {
    const originalWindow = globalThis.window;
    const trackCalls: unknown[] = [];

    setTestWindow({
      umami: {
        track: (payload: unknown) => {
          trackCalls.push(payload);
        },
      },
    });

    try {
      trackProfilePageItemClick({
        href: "https://github.com/leeve",
        itemId: "social-1",
        itemKind: "social",
        itemLabel: "GitHub",
        platform: "github",
        profilePageId: "page-1",
      });

      expect(trackCalls).toHaveLength(1);

      const payloadFactory = trackCalls[0] as (payload: { title?: string; url?: string }) => {
        data: Record<string, unknown>;
        name: string;
        title?: string;
        url: string;
      };

      expect(
        payloadFactory({
          title: "Leeve",
          url: "/leeve",
        })
      ).toEqual({
        data: {
          destination: "https://github.com/leeve",
          itemId: "social-1",
          itemKind: "social",
          itemLabel: "GitHub",
          platform: "github",
          profilePageId: "page-1",
        },
        name: PROFILE_PAGE_ANALYTICS_EVENT_NAMES.socialClick,
        title: "Leeve",
        url: "/_analytics/profile/page-1",
      });
    } finally {
      setTestWindow(originalWindow);
    }
  });
});
