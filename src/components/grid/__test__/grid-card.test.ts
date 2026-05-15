import { describe, expect, test } from "bun:test";

import { getGridCardMotion } from "@/components/grid/grid-card";

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
});
