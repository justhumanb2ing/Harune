import { describe, expect, test } from "bun:test";

import { buildProfileAnalyticsSummary } from "@/lib/analytics/profile-page-summary";

describe("profile analytics summary", () => {
  test("builds metric totals from Umami event rows", () => {
    const summary = buildProfileAnalyticsSummary(
      {
        endAt: new Date("2026-04-23T12:00:00.000Z").getTime(),
        label: "7d",
        startAt: new Date("2026-04-16T12:00:00.000Z").getTime(),
        timezone: "UTC",
        unit: "day",
      },
      [
        {
          t: "2026-04-21T00:00:00.000Z",
          x: "profile-page-view",
          y: 100,
        },
        {
          t: "2026-04-21T00:00:00.000Z",
          x: "profile-social-click",
          y: 15,
        },
        {
          t: "2026-04-22T00:00:00.000Z",
          x: "profile-link-click",
          y: 20,
        },
        {
          t: "2026-04-22T00:00:00.000Z",
          x: "ignored-event",
          y: 999,
        },
      ]
    );

    expect(summary.pageViews).toBe(100);
    expect(summary.socialClicks).toBe(15);
    expect(summary.linkClicks).toBe(20);
    expect(summary.itemClicks).toBe(35);
    expect(summary.ctr).toBe(35);
  });

  test("returns zero ctr when page views are absent", () => {
    const summary = buildProfileAnalyticsSummary(
      {
        endAt: new Date("2026-04-23T12:00:00.000Z").getTime(),
        label: "Today",
        startAt: new Date("2026-04-23T00:00:00.000Z").getTime(),
        timezone: "UTC",
        unit: "hour",
      },
      [
        {
          t: "2026-04-23T10:00:00.000Z",
          x: "profile-link-click",
          y: 4,
        },
      ]
    );

    expect(summary.pageViews).toBe(0);
    expect(summary.itemClicks).toBe(4);
    expect(summary.ctr).toBe(0);
  });

  test("rounds ctr to a whole percentage", () => {
    const summary = buildProfileAnalyticsSummary(
      {
        endAt: new Date("2026-04-23T12:00:00.000Z").getTime(),
        label: "Today",
        startAt: new Date("2026-04-23T00:00:00.000Z").getTime(),
        timezone: "UTC",
        unit: "hour",
      },
      [
        {
          t: "2026-04-23T10:00:00.000Z",
          x: "profile-page-view",
          y: 12,
        },
        {
          t: "2026-04-23T10:00:00.000Z",
          x: "profile-link-click",
          y: 5,
        },
      ]
    );

    expect(summary.ctr).toBe(42);
  });

  test("only sums rows inside the requested time window", () => {
    const summary = buildProfileAnalyticsSummary(
      {
        endAt: new Date("2026-04-23T12:00:00.000Z").getTime(),
        label: "7d",
        startAt: new Date("2026-04-16T12:00:00.000Z").getTime(),
        timezone: "UTC",
        unit: "day",
      },
      [
        {
          t: "2026-04-16T11:00:00.000Z",
          x: "profile-page-view",
          y: 999,
        },
        {
          t: "2026-04-16T12:00:00.000Z",
          x: "profile-page-view",
          y: 10,
        },
        {
          t: "2026-04-20T08:00:00.000Z",
          x: "profile-social-click",
          y: 2,
        },
        {
          t: "2026-04-23T12:00:00.000Z",
          x: "profile-link-click",
          y: 3,
        },
        {
          t: "2026-04-23T13:00:00.000Z",
          x: "profile-link-click",
          y: 999,
        },
      ]
    );

    expect(summary.pageViews).toBe(10);
    expect(summary.socialClicks).toBe(2);
    expect(summary.linkClicks).toBe(3);
    expect(summary.itemClicks).toBe(5);
    expect(summary.ctr).toBe(50);
  });

  test("adds previous-period comparisons and trend points", () => {
    const summary = buildProfileAnalyticsSummary(
      {
        endAt: new Date("2026-04-23T12:00:00.000Z").getTime(),
        label: "7d",
        startAt: new Date("2026-04-16T12:00:00.000Z").getTime(),
        timezone: "UTC",
        unit: "day",
      },
      [
        {
          t: "2026-04-12T12:00:00.000Z",
          x: "profile-page-view",
          y: 50,
        },
        {
          t: "2026-04-12T12:00:00.000Z",
          x: "profile-link-click",
          y: 5,
        },
        {
          t: "2026-04-20T12:00:00.000Z",
          x: "profile-page-view",
          y: 100,
        },
        {
          t: "2026-04-20T12:00:00.000Z",
          x: "profile-link-click",
          y: 20,
        },
      ],
      {
        previousWindow: {
          endAt: new Date("2026-04-16T11:59:59.999Z").getTime(),
          label: "Previous 7d",
          startAt: new Date("2026-04-09T12:00:00.000Z").getTime(),
          timezone: "UTC",
          unit: "day",
        },
      }
    );

    expect(summary.previous.pageViews).toBe(50);
    expect(summary.previous.itemClicks).toBe(5);
    expect(summary.changes.pageViews.absolute).toBe(50);
    expect(summary.changes.pageViews.percent).toBe(100);
    expect(summary.changes.ctr.absolute).toBe(10);
    expect(summary.series).toEqual([
      {
        ctr: 20,
        itemClicks: 20,
        linkClicks: 20,
        pageViews: 100,
        socialClicks: 0,
        timestamp: new Date("2026-04-20T12:00:00.000Z").getTime(),
      },
    ]);
  });
});
