import { describe, expect, test } from "bun:test";

import {
  getProfileBentoReadonlyGridBreakpoint,
  getProfileBentoReadonlyGridCanvasWidth,
} from "@/components/profile/public/profile-bento-readonly-grid";

describe("profile-bento readonly grid breakpoint", () => {
  test("keeps contained readonly grids tied to their measured container width", () => {
    expect(
      getProfileBentoReadonlyGridBreakpoint({
        measuredWidth: 795,
        viewportWidth: 1536,
      })
    ).toBe("compact");
    expect(
      getProfileBentoReadonlyGridBreakpoint({
        measuredWidth: 796,
        viewportWidth: 1024,
      })
    ).toBe("desktop");
  });

  test("matches the public page desktop switch to the editor 2xl breakpoint", () => {
    expect(
      getProfileBentoReadonlyGridBreakpoint({
        measuredWidth: 400,
        surface: "public-page",
        viewportWidth: 1535,
      })
    ).toBe("compact");
    expect(
      getProfileBentoReadonlyGridBreakpoint({
        measuredWidth: 400,
        surface: "public-page",
        viewportWidth: 1536,
      })
    ).toBe("desktop");
  });

  test("keeps the public desktop canvas wide enough after returning from compact", () => {
    expect(
      getProfileBentoReadonlyGridCanvasWidth({
        activeBreakpoint: "compact",
        measuredWidth: 860,
        surface: "public-page",
      })
    ).toBe(400);
    expect(
      getProfileBentoReadonlyGridCanvasWidth({
        activeBreakpoint: "desktop",
        measuredWidth: 400,
      })
    ).toBe(860);
  });
});
