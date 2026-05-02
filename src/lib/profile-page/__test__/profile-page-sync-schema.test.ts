import { describe, expect, test } from "bun:test";

import { MAX_SOCIAL_LINKS } from "@/lib/profile-page/types";
import {
  profileBentoSyncSchema,
  profilePageSyncSchema,
} from "@/lib/validations/profile-page.schema";

const validPayload = {
  page: {
    handle: "leeve",
    linkBlockPosition: 0,
    location: "",
    name: "Leeve",
    role: "",
    bio: "",
    image: null,
    backgroundImage: null,
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
  playlistItems: [
    {
      id: "draft:playlist-1",
      title: "Playlist",
      provider: "Spotify",
      content: "<iframe />",
      position: 0,
      blockPosition: 2,
    },
  ],
  textBoxItems: [
    {
      id: "draft:text-1",
      title: "About",
      description: "",
      position: 0,
      blockPosition: 1,
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
      playlistItems: [
        {
          id: "draft:playlist-1",
          title: "Playlist",
          provider: "Spotify",
          content: "<iframe />",
          position: 0,
          blockPosition: 2,
        },
        {
          id: "draft:playlist-2",
          title: "Playlist 2",
          provider: "YouTube",
          content: "<iframe />",
          position: 0,
          blockPosition: 3,
        },
      ],
      textBoxItems: [
        {
          id: "draft:text-1",
          title: "About",
          description: "",
          position: 0,
          blockPosition: 1,
        },
        {
          id: "draft:text-2",
          title: "Notes",
          description: "",
          position: 0,
          blockPosition: 2,
        },
      ],
    });

    expect(result.success).toBe(false);
  });
});

const validBentoPayload = {
  bento: [
    {
      id: "draft:link-1",
      type: "link",
      layout: {
        desktop: { x: 0, y: 0, w: 2, h: 2 },
        compact: { x: 0, y: 0, w: 2, h: 2 },
      },
      content: {
        title: "Docs",
        description: "",
        favicon: "",
        thumbnail: "",
        url: "https://example.com/docs",
      },
    },
    {
      id: "draft:text-1",
      type: "text",
      layout: {
        desktop: { x: 2, y: 0, w: 2, h: 2 },
        compact: { x: 0, y: 2, w: 2, h: 2 },
      },
      content: {
        content: "About",
      },
    },
  ],
};

describe("profile bento sync schema", () => {
  test("accepts a valid bento sync payload", () => {
    const result = profileBentoSyncSchema.safeParse(validBentoPayload);

    expect(result.success).toBe(true);
  });

  test("rejects duplicate bento ids", () => {
    const result = profileBentoSyncSchema.safeParse({
      bento: [validBentoPayload.bento[0], validBentoPayload.bento[0]],
    });

    expect(result.success).toBe(false);
  });

  test("requires both desktop and compact layouts", () => {
    const result = profileBentoSyncSchema.safeParse({
      bento: [
        {
          ...validBentoPayload.bento[0],
          layout: {
            desktop: { x: 0, y: 0, w: 2, h: 2 },
          },
        },
      ],
    });

    expect(result.success).toBe(false);
  });

  test("rejects layouts outside breakpoint columns", () => {
    const result = profileBentoSyncSchema.safeParse({
      bento: [
        {
          ...validBentoPayload.bento[0],
          layout: {
            desktop: { x: 3, y: 0, w: 2, h: 2 },
            compact: { x: 0, y: 0, w: 2, h: 2 },
          },
        },
      ],
    });

    expect(result.success).toBe(false);
  });

  test("accepts section bento as full-row h2 layout per breakpoint", () => {
    const result = profileBentoSyncSchema.safeParse({
      bento: [
        {
          id: "draft:section-1",
          type: "section",
          layout: {
            desktop: { x: 0, y: 0, w: 4, h: 2 },
            compact: { x: 0, y: 0, w: 2, h: 2 },
          },
          content: {
            title: "Featured",
          },
        },
      ],
    });

    expect(result.success).toBe(true);
  });

  test("accepts long section bento titles", () => {
    const result = profileBentoSyncSchema.safeParse({
      bento: [
        {
          id: "draft:section-1",
          type: "section",
          layout: {
            desktop: { x: 0, y: 0, w: 4, h: 2 },
            compact: { x: 0, y: 0, w: 2, h: 2 },
          },
          content: {
            title: "Featured ".repeat(40).trim(),
          },
        },
      ],
    });

    expect(result.success).toBe(true);
  });

  test("accepts media bento upload payloads", () => {
    const result = profileBentoSyncSchema.safeParse({
      bento: [
        {
          id: "preview:media-1",
          type: "media",
          layout: {
            desktop: { x: 0, y: 0, w: 2, h: 4 },
            compact: { x: 0, y: 0, w: 2, h: 4 },
          },
          content: {
            mediaType: "image",
            url: "https://pub.example.com/tmp/users/user-1/profile-page/bento/media",
            objectKey: "tmp/users/user-1/profile-page/bento/preview%3Amedia-1/upload",
            tempObjectKey: "tmp/users/user-1/profile-page/bento/preview%3Amedia-1/upload",
            contentHash: "a".repeat(64),
            contentType: "image/webp",
            href: null,
            alt: "Cover",
            caption: "Cover",
          },
        },
      ],
    });

    expect(result.success).toBe(true);
  });

  test("accepts arbitrary media bento links", () => {
    const result = profileBentoSyncSchema.safeParse({
      bento: [
        {
          id: "preview:media-1",
          type: "media",
          layout: {
            desktop: { x: 0, y: 0, w: 2, h: 4 },
            compact: { x: 0, y: 0, w: 2, h: 4 },
          },
          content: {
            mediaType: "video",
            url: "https://pub.example.com/public/users/user-1/profile-page/bento/media",
            objectKey: "public/users/user-1/profile-page/bento/media",
            href: "not-a-url",
            alt: "",
            caption: "",
          },
        },
      ],
    });

    expect(result.success).toBe(true);
  });

  test("accepts map bento payloads", () => {
    const result = profileBentoSyncSchema.safeParse({
      bento: [
        {
          id: "preview:map-1",
          type: "map",
          layout: {
            desktop: { x: 0, y: 0, w: 2, h: 2 },
            compact: { x: 0, y: 0, w: 2, h: 2 },
          },
          content: {
            latitude: 37.5665,
            longitude: 126.978,
            zoom: 13,
            caption: "Studio",
            url: "https://www.google.com/maps?q=37.566500,126.978000",
          },
        },
      ],
    });

    expect(result.success).toBe(true);
  });

  test("rejects map bento payloads outside coordinate bounds", () => {
    const result = profileBentoSyncSchema.safeParse({
      bento: [
        {
          id: "preview:map-1",
          type: "map",
          layout: {
            desktop: { x: 0, y: 0, w: 2, h: 2 },
            compact: { x: 0, y: 0, w: 2, h: 2 },
          },
          content: {
            latitude: 91,
            longitude: 181,
            zoom: 13,
            caption: "Studio",
            url: "https://www.google.com/maps?q=37.566500,126.978000",
          },
        },
      ],
    });

    expect(result.success).toBe(false);
  });

  test("rejects non-Google map bento URLs", () => {
    const result = profileBentoSyncSchema.safeParse({
      bento: [
        {
          id: "preview:map-1",
          type: "map",
          layout: {
            desktop: { x: 0, y: 0, w: 2, h: 2 },
            compact: { x: 0, y: 0, w: 2, h: 2 },
          },
          content: {
            latitude: 37.5665,
            longitude: 126.978,
            zoom: 13,
            caption: "Studio",
            url: "https://example.com/maps?q=37.566500,126.978000",
          },
        },
      ],
    });

    expect(result.success).toBe(false);
  });

  test("rejects resized section bento layouts", () => {
    const result = profileBentoSyncSchema.safeParse({
      bento: [
        {
          id: "draft:section-1",
          type: "section",
          layout: {
            desktop: { x: 0, y: 0, w: 2, h: 1 },
            compact: { x: 0, y: 0, w: 2, h: 2 },
          },
          content: {
            title: "Featured",
          },
        },
      ],
    });

    expect(result.success).toBe(false);
  });

  test("rejects content that does not match the bento type", () => {
    const result = profileBentoSyncSchema.safeParse({
      bento: [
        {
          ...validBentoPayload.bento[0],
          type: "text",
        },
      ],
    });

    expect(result.success).toBe(false);
  });
});
