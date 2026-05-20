import { describe, expect, test } from "bun:test";

import {
  createAutoBentoItem,
  createPreviewDraftBentoId,
  isSpotifyLinkUrl,
  normalizeProfileBentoItems,
  toBentoGridItem,
} from "@/components/profile/v2/profile-bento-grid-model";
import type { ProfileBentoItem } from "@/lib/profile/types";

describe("profile-bento-grid-model", () => {
  test("creates stable non-preview ids for draft bento items", () => {
    const currentItems: ProfileBentoItem[] = [];

    expect(createAutoBentoItem("link", currentItems).id.startsWith("preview:")).toBe(false);
    expect(createAutoBentoItem("text", currentItems).id.startsWith("preview:")).toBe(false);
    expect(createAutoBentoItem("section", currentItems).id.startsWith("preview:")).toBe(false);
    expect(createAutoBentoItem("map", currentItems).id.startsWith("preview:")).toBe(false);
    expect(createAutoBentoItem("media", currentItems).id.startsWith("preview:")).toBe(false);
    expect(createAutoBentoItem("clock", currentItems).id.startsWith("preview:")).toBe(false);
  });

  test("creates a preview upload id separately from the bento id", () => {
    const draftId = createAutoBentoItem("media", []).id;

    expect(createPreviewDraftBentoId(draftId)).toBe(`preview:${draftId}`);
  });

  test("creates clock items with the third resize preset by default", () => {
    const clockItem = createAutoBentoItem("clock", []);

    expect(clockItem.type).toBe("clock");
    if (clockItem.type !== "clock") {
      throw new Error("Expected clock item");
    }

    expect({ w: clockItem.layout.desktop.w, h: clockItem.layout.desktop.h }).toEqual({
      w: 2,
      h: 2,
    });
    expect({ w: clockItem.layout.compact.w, h: clockItem.layout.compact.h }).toEqual({
      w: 2,
      h: 2,
    });
    expect(clockItem.content.showSeconds).toBe(true);
    expect(clockItem.content.style.backgroundColor).toBe("#ffffff");
  });

  test("creates section items with a 4x1 default layout", () => {
    const sectionItem = createAutoBentoItem("section", []);

    expect(sectionItem.type).toBe("section");
    if (sectionItem.type !== "section") {
      throw new Error("Expected section item");
    }

    expect({ w: sectionItem.layout.desktop.w, h: sectionItem.layout.desktop.h }).toEqual({
      w: 4,
      h: 1,
    });
    expect({ w: sectionItem.layout.compact.w, h: sectionItem.layout.compact.h }).toEqual({
      w: 2,
      h: 1,
    });
  });

  test("creates spotify link items with a 2x2 compact default layout", () => {
    const spotifyLinkItem = createAutoBentoItem("link", [], {
      layoutOverrides: {
        compact: { w: 2, h: 2 },
      },
    });

    expect(spotifyLinkItem.layout.desktop).toMatchObject({
      w: 1,
      h: 2,
    });
    expect(spotifyLinkItem.layout.compact).toMatchObject({
      w: 2,
      h: 2,
    });
  });

  test("detects spotify urls by host", () => {
    expect(isSpotifyLinkUrl("https://open.spotify.com/track/abc")).toBe(true);
    expect(isSpotifyLinkUrl("https://spotify.link/abc123")).toBe(true);
    expect(isSpotifyLinkUrl("https://example.com")).toBe(false);
  });

  test("marks spotify link items as full bleed only when spotify oembed metadata is present", () => {
    const baseItem: ProfileBentoItem = {
      id: "spotify-link",
      type: "link",
      layout: {
        desktop: { x: 0, y: 0, w: 1, h: 2 },
        compact: { x: 0, y: 0, w: 2, h: 2 },
      },
      content: {
        title: "Spotify",
        description: null,
        favicon: null,
        domain: "open.spotify.com",
        thumbnail: null,
        url: "https://open.spotify.com/track/abc",
      },
    };

    expect(toBentoGridItem(baseItem)).not.toHaveProperty("isFullBleed", true);
    expect(
      toBentoGridItem({
        ...baseItem,
        content: {
          ...baseItem.content,
          metadata: {
            url: "https://open.spotify.com/track/abc",
            domain: "open.spotify.com",
            title: "Spotify",
            description: null,
            image: null,
            siteName: "Spotify",
            favicon: null,
            provider: "spotify",
            providerMetadata: {
              provider: "spotify",
              viewType: "spotify_oembed",
              fetchedAt: "2026-05-19T00:00:00.000Z",
              payload: {
                html: '<iframe src="https://open.spotify.com/embed/track/abc?utm_source=oembed"></iframe>',
              },
            },
          },
        },
      })
    ).toMatchObject({
      isFullBleed: true,
    });
  });

  test("creates text items with a nullable url and normalizes text urls", () => {
    const textItem = createAutoBentoItem("text", []);

    expect(textItem.type).toBe("text");
    if (textItem.type !== "text") {
      throw new Error("Expected text item");
    }

    expect(textItem.content.url).toBeNull();

    const normalized = normalizeProfileBentoItems([
      {
        ...textItem,
        content: {
          ...textItem.content,
          url: "  https://example.com/note  ",
        },
      },
    ]);

    expect(normalized[0]).toMatchObject({
      content: {
        url: "https://example.com/note",
      },
    });
  });
});
