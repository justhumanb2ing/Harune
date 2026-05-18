import { describe, expect, test } from "bun:test";

import {
  formatClock,
  formatClockDate,
  formatClockTime,
  getDefaultClockWidgetConfig,
  normalizeClockWidgetConfig,
} from "@/lib/profile/clock";

describe("clock", () => {
  test("defaults to showing seconds", () => {
    expect(getDefaultClockWidgetConfig().showSeconds).toBe(true);
  });

  test("formats time and date with the provided timezone and flags", () => {
    const date = new Date("2026-05-18T12:34:56Z");
    const config = {
      format: "24h",
      showDate: true,
      showSeconds: true,
      style: {
        backgroundColor: "#ffffff",
      },
      timezone: "UTC",
    } as const;

    const time = formatClockTime(date, config);
    const dateLabel = formatClockDate(date, config);
    const result = formatClock(new Date("2026-05-18T12:34:56Z"), {
      format: "24h",
      showDate: true,
      showSeconds: true,
      style: {
        backgroundColor: "#ffffff",
      },
      timezone: "UTC",
    });

    expect(result.includes("May 18, 2026")).toBe(true);
    expect(result.includes("12")).toBe(true);
    expect(result.includes("34")).toBe(true);
    expect(result.includes("56")).toBe(true);
    expect(time.includes("12")).toBe(true);
    expect(time.includes("34")).toBe(true);
    expect(time.includes("56")).toBe(true);
    expect(dateLabel).toBe("May 18, 2026");
  });

  test("treats omitted showSeconds as enabled", () => {
    const date = new Date("2026-05-18T12:34:56Z");

    const time = formatClockTime(
      date,
      normalizeClockWidgetConfig({
        format: "24h",
        showDate: true,
        style: {
          backgroundColor: "#ffffff",
        },
        timezone: "UTC",
      })
    );

    expect(time.includes("56")).toBe(true);
  });
});
