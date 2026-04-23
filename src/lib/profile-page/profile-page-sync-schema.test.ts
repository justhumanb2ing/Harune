import { describe, expect, test } from "bun:test";

import { MAX_SOCIAL_LINKS } from "@/lib/profile-page/types";
import { profilePageSyncSchema } from "@/lib/validations/profile-page.schema";

const validPayload = {
  page: {
    handle: "leeve",
    name: "Leeve",
    bio: "",
    image: null,
  },
  socialLinks: [
    {
      platform: "github",
      position: 0,
      url: "https://github.com/leeve",
    },
  ],
  linkItems: [
    {
      id: "draft:link-1",
      title: "Docs",
      description: "",
      favicon: "",
      position: 0,
      url: "https://example.com/docs",
    },
  ],
  textBoxItems: [
    {
      id: "draft:text-1",
      title: "About",
      description: "",
      position: 0,
    },
  ],
};

describe("profile page sync schema", () => {
  test("accepts a valid sync payload", () => {
    const result = profilePageSyncSchema.safeParse(validPayload);

    expect(result.success).toBe(true);
  });

  test("accepts arbitrary social link values", () => {
    const result = profilePageSyncSchema.safeParse({
      ...validPayload,
      socialLinks: [
        {
          platform: "github",
          position: 0,
          url: "@leeve",
        },
      ],
    });

    expect(result.success).toBe(true);
  });

  test("accepts empty social link values for selected platforms", () => {
    const result = profilePageSyncSchema.safeParse({
      ...validPayload,
      socialLinks: [
        {
          platform: "github",
          position: 0,
          url: "",
        },
      ],
    });

    expect(result.success).toBe(true);
  });

  test("rejects more than the maximum number of social links", () => {
    const result = profilePageSyncSchema.safeParse({
      ...validPayload,
      socialLinks: Array.from({ length: MAX_SOCIAL_LINKS + 1 }, (_, index) => ({
        platform: (
          [
            "x",
            "instagram",
            "youtube",
            "linkedin",
            "github",
            "threads",
            "soundcloud",
            "spotify",
            "behance",
          ] as const
        )[index],
        position: index,
        url: "",
      })),
    });

    expect(result.success).toBe(false);
  });

  test("rejects duplicate social platforms", () => {
    const result = profilePageSyncSchema.safeParse({
      ...validPayload,
      socialLinks: [
        {
          platform: "github",
          position: 0,
          url: "https://github.com/leeve",
        },
        {
          platform: "github",
          position: 1,
          url: "https://github.com/leeve-2",
        },
      ],
    });

    expect(result.success).toBe(false);
  });

  test("rejects duplicate link ids", () => {
    const result = profilePageSyncSchema.safeParse({
      ...validPayload,
      linkItems: [
        {
          id: "draft:link-1",
          title: "Docs",
          description: "",
          favicon: "",
          position: 0,
          url: "https://example.com/docs",
        },
        {
          id: "draft:link-1",
          title: "Blog",
          description: "",
          favicon: "",
          position: 1,
          url: "https://example.com/blog",
        },
      ],
    });

    expect(result.success).toBe(false);
  });

  test("rejects duplicate positions for every item type", () => {
    const result = profilePageSyncSchema.safeParse({
      ...validPayload,
      socialLinks: [
        {
          platform: "github",
          position: 0,
          url: "https://github.com/leeve",
        },
        {
          platform: "x",
          position: 0,
          url: "https://x.com/leeve",
        },
      ],
      linkItems: [
        {
          id: "draft:link-1",
          title: "Docs",
          description: "",
          favicon: "",
          position: 0,
          url: "https://example.com/docs",
        },
        {
          id: "draft:link-2",
          title: "Blog",
          description: "",
          favicon: "",
          position: 0,
          url: "https://example.com/blog",
        },
      ],
      textBoxItems: [
        {
          id: "draft:text-1",
          title: "About",
          description: "",
          position: 0,
        },
        {
          id: "draft:text-2",
          title: "Notes",
          description: "",
          position: 0,
        },
      ],
    });

    expect(result.success).toBe(false);
  });
});
