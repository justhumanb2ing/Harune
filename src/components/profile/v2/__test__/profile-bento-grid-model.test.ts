import { describe, expect, test } from "bun:test";

import {
  createAutoBentoItem,
  createPreviewDraftBentoId,
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
  });

  test("creates a preview upload id separately from the bento id", () => {
    const draftId = createAutoBentoItem("media", []).id;

    expect(createPreviewDraftBentoId(draftId)).toBe(`preview:${draftId}`);
  });
});
