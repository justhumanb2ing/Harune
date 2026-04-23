import { describe, expect, test } from "bun:test";

import { MAX_SOCIAL_LINKS } from "@/lib/profile-page/types";
import { onboardingSchema } from "@/lib/validations/auth.schema";

describe("onboarding schema", () => {
  test("accepts arbitrary values for all supported social links", () => {
    const result = onboardingSchema.safeParse({
      handle: "leeve",
      name: "Leeve",
      bio: "hello",
      socialLinks: {
        x: "@leeve",
        instagram: "@leeve",
        youtube: "@leeve",
        linkedin: "leeve-profile",
        github: "leeve",
        threads: "@leeve",
        soundcloud: "leeve",
        spotify: "artist:leeve",
      },
    });

    expect(result.success).toBe(true);
  });

  test("rejects more than the maximum number of selected social links", () => {
    const result = onboardingSchema.safeParse({
      handle: "leeve",
      name: "Leeve",
      bio: "hello",
      socialLinks: {
        x: "@leeve",
        instagram: "@leeve",
        youtube: "@leeve",
        linkedin: "leeve-profile",
        github: "leeve",
        threads: "@leeve",
        soundcloud: "leeve",
        spotify: "artist:leeve",
        behance: "leeve",
      },
    });

    expect(MAX_SOCIAL_LINKS).toBe(8);
    expect(result.success).toBe(false);
  });
});
