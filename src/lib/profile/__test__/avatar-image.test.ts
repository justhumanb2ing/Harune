import { describe, expect, test } from "bun:test";

import { getProfileImageObjectPosition } from "@/lib/profile/avatar-image";

describe("profile avatar image position", () => {
  test("centers the crop area within the rendered avatar", () => {
    expect(
      getProfileImageObjectPosition(
        {
          croppedAreaPixels: {
            x: 100,
            y: 50,
            width: 200,
            height: 200,
          },
        },
        {
          width: 600,
          height: 400,
        }
      )
    ).toBe("25% 25%");
  });

  test("falls back to centered positioning when crop metadata is unavailable", () => {
    expect(getProfileImageObjectPosition(null, { width: 600, height: 400 })).toBe("50% 50%");
  });
});
