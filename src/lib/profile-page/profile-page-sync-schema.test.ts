import { describe, expect, test } from "bun:test";

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
      url: "https://github.com/leeve",
    },
  ],
  linkItems: [
    {
      id: "draft:link-1",
      title: "Docs",
      description: "",
      favicon: "",
      url: "https://example.com/docs",
    },
  ],
  textBoxItems: [
    {
      id: "draft:text-1",
      title: "About",
      description: "",
    },
  ],
};

describe("profile page sync schema", () => {
  test("accepts a valid sync payload", () => {
    const result = profilePageSyncSchema.safeParse(validPayload);

    expect(result.success).toBe(true);
  });

  test("rejects duplicate social platforms", () => {
    const result = profilePageSyncSchema.safeParse({
      ...validPayload,
      socialLinks: [
        {
          platform: "github",
          url: "https://github.com/leeve",
        },
        {
          platform: "github",
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
          url: "https://example.com/docs",
        },
        {
          id: "draft:link-1",
          title: "Blog",
          description: "",
          favicon: "",
          url: "https://example.com/blog",
        },
      ],
    });

    expect(result.success).toBe(false);
  });
});
