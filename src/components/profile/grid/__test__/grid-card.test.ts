import { describe, expect, test } from "bun:test";

import {
  GRID_CARD_INTERACTIVE_TARGET_SELECTOR,
  getGridCardMotion,
  getGridCardTapScale,
  shouldEnableSectionHoverDuringGridDrag,
} from "@/components/profile/grid/grid-card";
import {
  getGridPlaceholderRadiusClassName,
  getSectionDragSiblingGuardClassName,
} from "@/components/profile/grid/profile-bento-grid-style";

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
    expect(getGridCardTapScale("section", false, false)).toBe(1);
    expect(getGridCardTapScale("link", true, false)).toBe(1);
    expect(getGridCardTapScale("text", true, true)).toBe(1);
  });

  test("treats popover panels as drag-cancel interactive targets", () => {
    expect(GRID_CARD_INTERACTIVE_TARGET_SELECTOR).toContain(".grid-action");
    expect(GRID_CARD_INTERACTIVE_TARGET_SELECTOR).toContain("[data-slot='popover-positioner']");
    expect(GRID_CARD_INTERACTIVE_TARGET_SELECTOR).toContain("[data-slot='popover-popup']");
  });

  test("disables passive section hover while another item is dragging", () => {
    expect(shouldEnableSectionHoverDuringGridDrag("section", true, false)).toBe(false);
    expect(shouldEnableSectionHoverDuringGridDrag("section", true, true)).toBe(true);
    expect(shouldEnableSectionHoverDuringGridDrag("link", true, false)).toBe(true);
  });

  test("matches section placeholder radius to the visible section shell", () => {
    expect(
      getGridPlaceholderRadiusClassName({
        isSectionDragActive: true,
        isThinPlaceholderShapeActive: false,
      })
    ).toBe("[&_.react-grid-placeholder]:rounded-2xl!");
    expect(
      getGridPlaceholderRadiusClassName({
        isSectionDragActive: false,
        isThinPlaceholderShapeActive: false,
      })
    ).toBe("[&_.react-grid-placeholder]:rounded-[1.5rem]!");
  });

  test("disables sibling hit-testing only while section drag is active", () => {
    expect(getSectionDragSiblingGuardClassName(true)).toBe(
      "[&_.react-grid-item:not(.react-draggable-dragging):not(.react-grid-placeholder)]:pointer-events-none"
    );
    expect(getSectionDragSiblingGuardClassName(false)).toBe("");
  });
});
