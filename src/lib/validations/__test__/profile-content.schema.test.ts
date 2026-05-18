import { describe, expect, test } from "bun:test";

import { profileBentoSyncSchema } from "@/lib/validations/profile-content.schema";

describe("profile content schema", () => {
  test("accepts clock bento payloads", () => {
    const result = profileBentoSyncSchema.safeParse({
      bento: [
        {
          id: "clock-1",
          type: "clock",
          layout: {
            desktop: { x: 0, y: 0, w: 2, h: 2 },
            compact: { x: 0, y: 0, w: 2, h: 2 },
          },
          content: {
            showDate: true,
            showSeconds: false,
            style: {
              backgroundColor: "#ffffff",
            },
            timezone: "Asia/Seoul",
          },
        },
      ],
    });

    expect(result.success).toBe(true);
  });
});
