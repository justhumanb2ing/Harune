import { describe, expect, test } from "bun:test";

import {
  LINK_BLOCK_ID,
  buildSyncPayload,
  createDraftData,
  createProfilePageEditorStore,
  getPageEditorBlocks,
  textBoxBlockId,
} from "@/components/section/profile-page/profile-page-editor-store";
import { MAX_SOCIAL_LINKS, type ProfilePageData } from "@/lib/profile-page/types";

const createProfilePageData = (): ProfilePageData => ({
  page: {
    id: "page-1",
    handle: "leeve",
    linkBlockPosition: 0,
    location: "Seoul",
    name: "Leeve",
    role: "Builder",
    bio: "hello",
    image: "https://cdn.example.com/profile.png",
    backgroundImage: "https://cdn.example.com/background.png",
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
        position: 0,
        url: "https://x.com/leeve",
      },
      {
        platform: "github",
        position: 1,
        url: "https://github.com/leeve",
      },
    ]);
  });

  test("empty social inputs are not registered", () => {
    const store = createProfilePageEditorStore();

    store.actions.rebaseFromServer(createProfilePageData());
    store.actions.setSocialUrl("spotify", "");

    const draftData = store.getState().draftData;

    if (!draftData) {
      throw new Error("Expected draft data to exist");
    }

    expect(store.getState().hasUnsyncedChanges).toBe(false);
    expect(buildSyncPayload(draftData).socialLinks).toEqual([
      {
        platform: "github",
        position: 0,
        url: "https://github.com/leeve",
      },
    ]);
  });

  test("clearing a social link input unregisters it", () => {
    const store = createProfilePageEditorStore();

    store.actions.rebaseFromServer(createProfilePageData());
    store.actions.setSocialUrl("github", "");

    const draftData = store.getState().draftData;

    if (!draftData) {
      throw new Error("Expected draft data to exist");
    }

    expect(draftData.socialLinks).toEqual([]);
    expect(buildSyncPayload(draftData).socialLinks).toEqual([]);
  });

  test("adding a social platform without a value does not register it", () => {
    const store = createProfilePageEditorStore();

    store.actions.rebaseFromServer(createProfilePageData());

    store.actions.addSocialLink("behance");

    expect(store.getState().hasUnsyncedChanges).toBe(false);
    expect(
      store.getState().draftData?.socialLinks.some((item) => item.platform === "behance")
    ).toBe(false);
  });

  test("cannot register more than the maximum social links from input values", () => {
    const store = createProfilePageEditorStore();

    store.actions.rebaseFromServer({
      ...createProfilePageData(),
      socialLinks: [
        { id: "social-1", platform: "x", url: "https://x.com/leeve", position: 0 },
        {
          id: "social-2",
          platform: "instagram",
          url: "https://instagram.com/leeve",
          position: 1,
        },
        {
          id: "social-3",
          platform: "youtube",
          url: "https://youtube.com/@leeve",
          position: 2,
        },
        {
          id: "social-4",
          platform: "linkedin",
          url: "https://linkedin.com/in/leeve",
          position: 3,
        },
        { id: "social-5", platform: "github", url: "https://github.com/leeve", position: 4 },
        {
          id: "social-6",
          platform: "threads",
          url: "https://www.threads.net/@leeve",
          position: 5,
        },
        {
          id: "social-7",
          platform: "soundcloud",
          url: "https://soundcloud.com/leeve",
          position: 6,
        },
        {
          id: "social-8",
          platform: "spotify",
          url: "https://open.spotify.com/artist/leeve",
          position: 7,
        },
      ],
    });

    store.actions.setSocialUrl("behance", "https://behance.net/leeve");

    expect(store.getState().draftData?.socialLinks).toHaveLength(MAX_SOCIAL_LINKS);
    expect(
      store.getState().draftData?.socialLinks.some((item) => item.platform === "behance")
    ).toBe(false);
  });

  test("reordering existing social links stays dirty and serializes positions", () => {
    const store = createProfilePageEditorStore();

    store.actions.rebaseFromServer({
      ...createProfilePageData(),
      socialLinks: [
        {
          id: "social-1",
          platform: "github",
          url: "https://github.com/leeve",
          position: 0,
        },
        {
          id: "social-2",
          platform: "x",
          url: "https://x.com/leeve",
          position: 1,
        },
      ],
    });

    store.actions.reorderSocialLinks("x", "github");

    const draftData = store.getState().draftData;

    if (!draftData) {
      throw new Error("Expected draft data to exist");
    }

    expect(store.getState().hasUnsyncedChanges).toBe(true);
    expect(
      buildSyncPayload(draftData).socialLinks.map((item) => [item.platform, item.position])
    ).toEqual([
      ["x", 0],
      ["github", 1],
    ]);
  });

  test("reordering link items stays dirty and serializes positions", () => {
    const store = createProfilePageEditorStore();

    store.actions.rebaseFromServer({
      ...createProfilePageData(),
      linkItems: [
        {
          id: "link-1",
          title: "Docs",
          description: null,
          favicon: null,
          url: "https://example.com/docs",
          position: 0,
        },
        {
          id: "link-2",
          title: "Blog",
          description: null,
          favicon: null,
          url: "https://example.com/blog",
          position: 1,
        },
      ],
    });

    store.actions.reorderLinkItems("link-2", "link-1");

    const draftData = store.getState().draftData;

    if (!draftData) {
      throw new Error("Expected draft data to exist");
    }

    expect(store.getState().hasUnsyncedChanges).toBe(true);
    expect(buildSyncPayload(draftData).linkItems.map((item) => [item.id, item.position])).toEqual([
      ["link-2", 0],
      ["link-1", 1],
    ]);
  });

  test("sync payload derives item positions from array order", () => {
    const store = createProfilePageEditorStore();

    store.actions.rebaseFromServer({
      ...createProfilePageData(),
      socialLinks: [
        {
          id: "social-1",
          platform: "github",
          url: "https://github.com/leeve",
          position: 0,
        },
        {
          id: "social-2",
          platform: "x",
          url: "https://x.com/leeve",
          position: 1,
        },
      ],
      linkItems: [
        {
          id: "link-1",
          title: "Docs",
          description: null,
          favicon: null,
          url: "https://example.com/docs",
          position: 0,
        },
        {
          id: "link-2",
          title: "Blog",
          description: null,
          favicon: null,
          url: "https://example.com/blog",
          position: 1,
        },
      ],
      textBoxItems: [
        {
          id: "text-1",
          title: "About",
          description: null,
          position: 0,
          blockPosition: 1,
        },
        {
          id: "text-2",
          title: "Notes",
          description: null,
          position: 1,
          blockPosition: 2,
        },
      ],
    });

    const draftData = store.getState().draftData;

    if (!draftData) {
      throw new Error("Expected draft data to exist");
    }

    draftData.socialLinks = [
      {
        ...draftData.socialLinks[1],
        position: 1,
      },
      {
        ...draftData.socialLinks[0],
        position: 0,
      },
    ];
    draftData.linkItems = [
      {
        ...draftData.linkItems[1],
        position: 1,
      },
      {
        ...draftData.linkItems[0],
        position: 0,
      },
    ];
    draftData.textBoxItems = [
      {
        ...draftData.textBoxItems[1],
        position: 1,
      },
      {
        ...draftData.textBoxItems[0],
        position: 0,
      },
    ];

    expect(
      buildSyncPayload(draftData).socialLinks.map((item) => [item.platform, item.position])
    ).toEqual([
      ["x", 0],
      ["github", 1],
    ]);
    expect(buildSyncPayload(draftData).linkItems.map((item) => [item.id, item.position])).toEqual([
      ["link-2", 0],
      ["link-1", 1],
    ]);
    expect(
      buildSyncPayload(draftData).textBoxItems.map((item) => [item.id, item.position])
    ).toEqual([
      ["text-2", 0],
      ["text-1", 1],
    ]);
  });

  test("server data is drafted in persisted position order", () => {
    const draftData = createDraftData({
      ...createProfilePageData(),
      socialLinks: [
        {
          id: "social-1",
          platform: "mail",
          url: "hello@example.com",
          position: 2,
        },
        {
          id: "social-2",
          platform: "x",
          url: "https://x.com/leeve",
          position: 1,
        },
      ],
      linkItems: [
        {
          id: "link-1",
          title: "Second",
          description: null,
          favicon: null,
          url: "https://example.com/second",
          position: 1,
        },
        {
          id: "link-2",
          title: "First",
          description: null,
          favicon: null,
          url: "https://example.com/first",
          position: 0,
        },
      ],
      textBoxItems: [
        {
          id: "text-1",
          title: "Second",
          description: null,
          position: 1,
          blockPosition: 2,
        },
        {
          id: "text-2",
          title: "First",
          description: null,
          position: 0,
          blockPosition: 1,
        },
      ],
    });

    expect(draftData.socialLinks.map((item) => item.platform)).toEqual(["x", "mail"]);
    expect(draftData.linkItems.map((item) => item.id)).toEqual(["link-2", "link-1"]);
    expect(draftData.textBoxItems.map((item) => item.id)).toEqual(["text-2", "text-1"]);
  });

  test("reordering text box items stays dirty and serializes positions", () => {
    const store = createProfilePageEditorStore();

    store.actions.rebaseFromServer({
      ...createProfilePageData(),
      textBoxItems: [
        {
          id: "text-1",
          title: "About",
          description: null,
          position: 0,
          blockPosition: 1,
        },
        {
          id: "text-2",
          title: "Notes",
          description: null,
          position: 1,
          blockPosition: 2,
        },
      ],
    });

    store.actions.reorderTextBoxItems("text-2", "text-1");

    const draftData = store.getState().draftData;

    if (!draftData) {
      throw new Error("Expected draft data to exist");
    }

    expect(store.getState().hasUnsyncedChanges).toBe(true);
    expect(
      buildSyncPayload(draftData).textBoxItems.map((item) => [item.id, item.position])
    ).toEqual([
      ["text-2", 0],
      ["text-1", 1],
    ]);
  });

  test("reordering page editor blocks serializes link and text block positions", () => {
    const store = createProfilePageEditorStore();

    store.actions.rebaseFromServer({
      ...createProfilePageData(),
      textBoxItems: [
        {
          id: "text-1",
          title: "About",
          description: null,
          position: 0,
          blockPosition: 1,
        },
        {
          id: "text-2",
          title: "Notes",
          description: null,
          position: 1,
          blockPosition: 2,
        },
      ],
    });

    store.actions.reorderPageBlocks(textBoxBlockId("text-2"), LINK_BLOCK_ID);

    const draftData = store.getState().draftData;

    if (!draftData) {
      throw new Error("Expected draft data to exist");
    }

    expect(store.getState().hasUnsyncedChanges).toBe(true);
    expect(getPageEditorBlocks(draftData).map((block) => block.id)).toEqual([
      textBoxBlockId("text-2"),
      LINK_BLOCK_ID,
      textBoxBlockId("text-1"),
    ]);
    expect(buildSyncPayload(draftData).page.linkBlockPosition).toBe(1);
    expect(
      buildSyncPayload(draftData).textBoxItems.map((item) => [item.id, item.blockPosition])
    ).toEqual([
      ["text-1", 2],
      ["text-2", 0],
    ]);
  });

  test("new text box draft is saved locally without an add button", () => {
    const store = createProfilePageEditorStore();

    store.actions.rebaseFromServer(createProfilePageData());
    store.actions.setNewTextBox({
      title: "Memo",
      description: "Keep this local until sync",
    });

    expect(store.getState().draftData?.textBoxItems[0]?.title).toBe("Memo");
    expect(store.getState().draftData?.textBoxItems[0]?.description).toBe(
      "Keep this local until sync"
    );

    store.actions.resetNewTextBoxComposer();

    expect(store.getState().newTextBox).toEqual({
      title: "",
      description: "",
    });
    expect(store.getState().draftData?.textBoxItems).toHaveLength(1);
    expect(store.getState().hasUnsyncedChanges).toBe(true);
  });

  test("new text box description alone does not create a local item", () => {
    const store = createProfilePageEditorStore();

    store.actions.rebaseFromServer(createProfilePageData());
    store.actions.setNewTextBox({
      title: "",
      description: "Description without a title",
    });

    expect(store.getState().newTextBox).toEqual({
      title: "",
      description: "Description without a title",
    });
    expect(store.getState().draftData?.textBoxItems).toHaveLength(0);
    expect(store.getState().hasUnsyncedChanges).toBe(false);
  });

  test("new text box draft can be added explicitly", () => {
    const store = createProfilePageEditorStore();

    store.actions.rebaseFromServer(createProfilePageData());
    store.actions.addNewTextBoxFromDraft({
      title: "",
      description: "Description without a title",
    });

    expect(store.getState().draftData?.textBoxItems).toHaveLength(0);
    expect(store.getState().hasUnsyncedChanges).toBe(false);

    store.actions.addNewTextBoxFromDraft({
      title: "  Memo  ",
      description: "Keep this local until sync",
    });

    expect(store.getState().draftData?.textBoxItems[0]?.title).toBe("Memo");
    expect(store.getState().draftData?.textBoxItems[0]?.description).toBe(
      "Keep this local until sync"
    );
    expect(store.getState().hasUnsyncedChanges).toBe(true);
  });
});
