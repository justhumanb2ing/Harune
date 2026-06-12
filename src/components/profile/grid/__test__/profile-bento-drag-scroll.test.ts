import { describe, expect, test } from "bun:test";

import {
  getPointerCoordinatesFromEvent,
  getVerticalAutoScrollDelta,
  PROFILE_BENTO_DRAG_SCROLL_EDGE_PX,
  PROFILE_BENTO_DRAG_SCROLL_MAX_SPEED_PX,
} from "@/components/profile/grid/profile-bento-drag-scroll";

describe("profile bento drag scroll", () => {
  test("derives pointer coordinates from mouse and touch events", () => {
    expect(getPointerCoordinatesFromEvent({ clientX: 12, clientY: 34 } as Event)).toEqual({
      x: 12,
      y: 34,
    });

    expect(
      getPointerCoordinatesFromEvent({
        touches: [{ clientX: 56, clientY: 78 }],
      } as unknown as Event)
    ).toEqual({ x: 56, y: 78 });
  });

  test("returns scroll velocity near the top and bottom edges", () => {
    expect(getVerticalAutoScrollDelta(50, 0, 800)).toBeLessThan(0);
    expect(getVerticalAutoScrollDelta(400, 0, 800)).toBe(0);
    expect(getVerticalAutoScrollDelta(770, 0, 800)).toBeGreaterThan(0);
  });

  test("caps scroll speed at the configured maximum", () => {
    expect(getVerticalAutoScrollDelta(0, 0, 800)).toBe(-PROFILE_BENTO_DRAG_SCROLL_MAX_SPEED_PX);
    expect(getVerticalAutoScrollDelta(800, 0, 800)).toBe(PROFILE_BENTO_DRAG_SCROLL_MAX_SPEED_PX);
    expect(getVerticalAutoScrollDelta(PROFILE_BENTO_DRAG_SCROLL_EDGE_PX / 2, 0, 800)).toBe(-14);
    expect(getVerticalAutoScrollDelta(-20, 0, 800)).toBe(-PROFILE_BENTO_DRAG_SCROLL_MAX_SPEED_PX);
    expect(getVerticalAutoScrollDelta(820, 0, 800)).toBe(PROFILE_BENTO_DRAG_SCROLL_MAX_SPEED_PX);
  });
});
