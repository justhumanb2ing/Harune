import { describe, expect, test } from "bun:test";

import { MAX_SOCIAL_LINKS } from "@/lib/profile-page/types";
import { onboardingSchema } from "@/lib/validations/auth.schema";

describe("onboarding schema", () => {
  test("accepts arbitrary values for all supported social links", () => {
    const result = onboardingSchema.safeParse({
      handle: "leeve",
      name: "Leeve",
      bio: "hello",
      role: "Designer",
      location: "Seoul",
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

  test("accepts empty optional role and location fields", () => {
    const result = onboardingSchema.safeParse({
      handle: "leeve",
      name: "Leeve",
      role: "",
      location: "   ",
      socialLinks: {},
    });

    expect(result.success).toBe(true);
    if (!result.success) {
      throw new Error("Expected onboarding schema to accept empty optional fields.");
    }
    expect(result.data).toMatchObject({
      role: undefined,
      location: undefined,
    });
  });

  test("rejects optional role and location over 100 characters", () => {
    const longValue = "a".repeat(101);

    const result = onboardingSchema.safeParse({
      handle: "leeve",
      name: "Leeve",
      role: longValue,
      location: longValue,
      socialLinks: {},
    });

    expect(result.success).toBe(false);
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
