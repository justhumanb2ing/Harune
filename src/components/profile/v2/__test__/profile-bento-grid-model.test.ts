import { describe, expect, test } from "bun:test";

import {
  createAutoBentoItem,
  createPreviewDraftBentoId,
  normalizeProfileBentoItems,
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
