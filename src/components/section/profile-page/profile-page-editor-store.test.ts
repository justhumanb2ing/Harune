import { describe, expect, test } from "bun:test";

import {
  buildSyncPayload,
  createProfilePageEditorStore,
} from "@/components/section/profile-page/profile-page-editor-store";
import type { ProfilePageData } from "@/lib/profile-page/types";

const createProfilePageData = (): ProfilePageData => ({
  page: {
    id: "page-1",
    handle: "leeve",
    name: "Leeve",
    bio: "hello",
    image: "https://cdn.example.com/profile.png",
  },
  socialLinks: [
    {
      id: "social-1",
      platform: "github",
      url: "https://github.com/leeve",
      position: 0,
    },
  ],
  linkItems: [],
  textBoxItems: [],
});

describe("profile page editor store", () => {
  test("rebase initializes a clean draft", () => {
    const store = createProfilePageEditorStore();

    store.actions.rebaseFromServer(createProfilePageData());

    expect(store.getState().draftData?.page.handle).toBe("leeve");
    expect(store.getState().hasUnsyncedChanges).toBe(false);
  });

  test("adding and removing a temp link returns to clean state", () => {
    const store = createProfilePageEditorStore();

    store.actions.rebaseFromServer(createProfilePageData());
    store.actions.setNewLink({
      title: "Docs",
      description: "",
      favicon: "",
      url: "https://example.com/docs",
    });
    store.actions.addNewLink();

    const tempLinkId = store.getState().draftData?.linkItems[0]?.id;

    expect(tempLinkId?.startsWith("draft:")).toBe(true);
    expect(store.getState().hasUnsyncedChanges).toBe(true);

    if (!tempLinkId) {
      throw new Error("Expected temp link id to exist");
    }

    store.actions.removeLinkItem(tempLinkId);

    expect(store.getState().draftData?.linkItems).toHaveLength(0);
    expect(store.getState().hasUnsyncedChanges).toBe(false);
  });

  test("social draft updates are reflected in sync payload order", () => {
    const store = createProfilePageEditorStore();

    store.actions.rebaseFromServer(createProfilePageData());
    store.actions.setSocialUrl("x", " https://x.com/leeve ");
    store.actions.reorderSocialLinks("x", "github");

    const draftData = store.getState().draftData;

    if (!draftData) {
      throw new Error("Expected draft data to exist");
    }

    const payload = buildSyncPayload(draftData);

    expect(payload.socialLinks).toEqual([
      {
        platform: "x",
        url: "https://x.com/leeve",
      },
      {
        platform: "github",
        url: "https://github.com/leeve",
      },
    ]);
  });
});
