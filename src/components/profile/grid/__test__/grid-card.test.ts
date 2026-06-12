import { describe, expect, test } from "bun:test";

import {
  GRID_CARD_INTERACTIVE_TARGET_SELECTOR,
  getGridCardMotion,
  getGridCardTapScale,
} from "@/components/profile/grid/grid-card";

describe("grid-card motion", () => {
  test("uses full motion when reduce motion is off", () => {
    expect(getGridCardMotion("entering", false)).toEqual({
      animate: { opacity: 1, y: 0 },
      initial: { opacity: 0, y: 8 },
      transition: { duration: 0.26, ease: [0.22, 1, 0.36, 1] },
    });

    expect(getGridCardMotion("exiting", false)).toEqual({
      animate: { opacity: 0, y: -6 },
      initial: false,
      transition: { duration: 0.16, ease: [0.22, 1, 0.36, 1] },
    });
  });

  test("falls back to opacity only when reduce motion is on", () => {
    expect(getGridCardMotion("entering", true)).toEqual({
      animate: { opacity: 1 },
      initial: { opacity: 0 },
      transition: { duration: 0.12, ease: [0.22, 1, 0.36, 1] },
    });

    expect(getGridCardMotion("exiting", true)).toEqual({
      animate: { opacity: 0 },
      initial: false,
      transition: { duration: 0.12, ease: [0.22, 1, 0.36, 1] },
    });
  });

  test("disables tap scale for readonly text and section cards", () => {
    expect(getGridCardTapScale("text", true, false)).toBe(1);
    expect(getGridCardTapScale("text", false, false)).toBe(1.025);
    expect(getGridCardTapScale("section", true, false)).toBe(1);
    expect(getGridCardTapScale("link", true, false)).toBe(1);
    expect(getGridCardTapScale("text", true, true)).toBe(1);
  });

  test("treats popover panels as drag-cancel interactive targets", () => {
    expect(GRID_CARD_INTERACTIVE_TARGET_SELECTOR).toContain(".grid-action");
    expect(GRID_CARD_INTERACTIVE_TARGET_SELECTOR).toContain("[data-slot='popover-positioner']");
    expect(GRID_CARD_INTERACTIVE_TARGET_SELECTOR).toContain("[data-slot='popover-popup']");
  });
});
