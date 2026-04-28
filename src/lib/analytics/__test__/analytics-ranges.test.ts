import { describe, expect, test } from "bun:test";

import {
  getAnalyticsRangeWindow,
  getPreviousAnalyticsRangeWindow,
  normalizeAnalyticsTimezone,
} from "@/lib/analytics/analytics-ranges";

describe("analytics ranges", () => {
  test("normalizes invalid timezones to UTC", () => {
    expect(normalizeAnalyticsTimezone("Not/A_Timezone")).toBe("UTC");
  });

  test("computes the start of today in the requested timezone", () => {
    const now = new Date("2026-04-23T12:34:56.000Z");
    const range = getAnalyticsRangeWindow("today", {
      now,
      timezone: "Asia/Seoul",
    });

    expect(range.startAt).toBe(new Date("2026-04-22T15:00:00.000Z").getTime());
    expect(range.endAt).toBe(now.getTime());
    expect(range.unit).toBe("hour");
  });

  test("keeps 7d as a rolling seven day window", () => {
    const now = new Date("2026-04-23T12:34:56.000Z");
    const range = getAnalyticsRangeWindow("7d", {
      now,
      timezone: "UTC",
    });

    expect(range.startAt).toBe(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    expect(range.unit).toBe("day");
  });

  test("compares today with yesterday at the same elapsed time", () => {
    const now = new Date("2026-04-23T12:34:56.000Z");
    const range = getPreviousAnalyticsRangeWindow("today", {
      now,
      timezone: "Asia/Seoul",
    });

    expect(range.label).toBe("Yesterday");
    expect(range.startAt).toBe(new Date("2026-04-21T15:00:00.000Z").getTime());
    expect(range.endAt).toBe(new Date("2026-04-22T12:34:56.000Z").getTime());
    expect(range.unit).toBe("hour");
  });

  test("compares rolling ranges with the immediately previous matching window", () => {
    const now = new Date("2026-04-23T12:34:56.000Z");
    const range = getPreviousAnalyticsRangeWindow("7d", {
      now,
      timezone: "UTC",
    });

    expect(range.startAt).toBe(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    expect(range.endAt).toBe(now.getTime() - 7 * 24 * 60 * 60 * 1000 - 1);
    expect(range.unit).toBe("day");
  });
});
