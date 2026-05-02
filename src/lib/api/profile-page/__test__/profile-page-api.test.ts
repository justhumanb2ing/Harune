import { describe, expect, test } from "bun:test";
import type {
  LinkItemInput,
  ProfileBentoSyncValues,
  ProfilePageSyncValues,
  ProfilePageUpdateValues,
  ReorderItemsInput,
  TextBoxItemInput,
} from "@/lib/validations/profile-page.schema";
import { createProfilePageApi } from "../app";

const authenticatedSession = {
  expires: "2026-05-02T00:00:00.000Z",
  user: {
    email: "creator@example.com",
    id: "user-1",
  },
};

const validLinkPayload: LinkItemInput = {
  description: "A useful link",
  favicon: "https://example.com/favicon.ico",
  title: "Example",
  url: "https://example.com",
};

const defaultLinkItem = {
  ...validLinkPayload,
  id: "link-1",
  position: 0,
};

const validTextBoxPayload: TextBoxItemInput = {
  description: "A useful note",
  title: "Note",
};

const defaultTextBoxItem = {
  ...validTextBoxPayload,
  blockPosition: 1,
  id: "text-1",
  position: 0,
};

const validProfilePagePayload: ProfilePageUpdateValues = {
  backgroundImage: null,
  bio: "Maker",
  handle: "demo",
  image: null,
  location: "Seoul",
  name: "Demo",
  role: "Designer",
};

const defaultProfilePageData = {
  linkItems: [defaultLinkItem],
  page: {
    ...validProfilePagePayload,
    backgroundImage: null,
    id: "page-1",
    image: null,
    linkBlockPosition: 0,
    updatedAt: new Date("2026-05-02T00:00:00.000Z"),
  },
  playlistItems: [],
  socialLinks: [],
  textBoxItems: [defaultTextBoxItem],
};

const validProfilePageSyncPayload: ProfilePageSyncValues = {
  linkItems: [],
  page: {
    backgroundImage: null,
    bio: "Maker",
    handle: "demo",
    image: null,
    linkBlockPosition: 0,
    location: "Seoul",
    name: "Demo",
    role: "Designer",
  },
  playlistItems: [],
  socialLinks: [],
  textBoxItems: [],
};

const validProfileBentoSyncPayload: ProfileBentoSyncValues = {
  bento: [
    {
      content: {
        description: "",
        favicon: "",
        thumbnail: "",
        title: "Docs",
        url: "https://example.com/docs",
      },
      id: "draft:link-1",
      layout: {
        compact: { h: 2, w: 2, x: 0, y: 0 },
        desktop: { h: 2, w: 2, x: 0, y: 0 },
      },
      type: "link",
    },
  ],
};

const defaultProfileBentoData = {
  bento: validProfileBentoSyncPayload.bento,
  page: {
    handle: "demo",
    id: "page-1",
    name: "Demo",
  },
};

type ProfilePageApiOptions = Parameters<typeof createProfilePageApi>[0];

const createTestProfilePageApi = (overrides: Partial<ProfilePageApiOptions> = {}) =>
  createProfilePageApi({
    auth: async () => authenticatedSession,
    createLinkItem: async () => defaultLinkItem,
    createTextBoxItem: async () => defaultTextBoxItem,
    deleteLinkItem: async () => {},
    deleteTextBoxItem: async () => {},
    getProfilePageEditorData: async () => defaultProfilePageData,
    isHandleAvailableForUser: async () => true,
    reorderLinkItems: async () => {},
    reorderTextBoxItems: async () => {},
    revalidatePath: () => {},
    syncProfileBentoDraft: async () => defaultProfileBentoData,
    syncProfilePageDraft: async () => defaultProfilePageData,
    createS3UploadFields: async () => ({
      fields: {
        "Content-Type": "image/png",
      },
      url: "https://storage.example.com",
    }),
    deletePublicS3Object: async () => true,
    getMissingS3ConfigKeys: () => [],
    getPublicS3ObjectUrl: (key) => `https://cdn.example.com/${key}`,
    getS3ObjectKeyFromPublicUrl: (url) => new URL(url).pathname.replace(/^\/+/, ""),
    getProfileBentoMediaPublicUrl: ({ contentHash, objectKey }) =>
      `https://media.example.com/${objectKey}?v=${contentHash}`,
    getTemporaryProfileBentoMediaObjectKey: ({ bentoId, userId }) =>
      `tmp/users/${userId}/profile-page/bento/${bentoId}/media-temp`,
    hashProfileBentoMediaBuffer: (buffer) =>
      Array.from(new Uint8Array(buffer))
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("")
        .padEnd(64, "0")
        .slice(0, 64),
    putTemporaryProfileBentoMediaObject: async () => {},
    updateProfileImage: async ({ imageKind, imageUrl }) => ({
      backgroundImage: imageKind === "background" ? imageUrl : null,
      image: imageKind === "profile" ? imageUrl : null,
    }),
    updateProfileMetadata: async () => defaultProfilePageData.page,
    updateTextBoxItem: async () => defaultTextBoxItem,
    updateLinkItem: async () => defaultLinkItem,
    ...overrides,
  });

describe("profile page Hono API", () => {
  test("returns the existing unauthorized JSON contract when the session is missing", async () => {
    const app = createTestProfilePageApi({
      auth: async () => null,
    });

    const response = await app.request("/handle-availability?handle=demo");
    const body = (await response.json()) as { error: string; message: string };

    expect(response.status).toBe(401);
    expect(body).toEqual({
      error: "Unauthorized",
      message: "You are not authorized to perform this action",
    });
  });

  test("validates the handle query before calling the domain layer", async () => {
    let domainCallCount = 0;
    const app = createTestProfilePageApi({
      auth: async () => authenticatedSession,
      isHandleAvailableForUser: async () => {
        domainCallCount += 1;
        return true;
      },
    });

    const missingHandleResponse = await app.request("/handle-availability");
    const missingHandleBody = (await missingHandleResponse.json()) as { error: string };
    const invalidHandleResponse = await app.request("/handle-availability?handle=bad-handle");
    const invalidHandleBody = (await invalidHandleResponse.json()) as { error: string };
    const reservedHandleResponse = await app.request("/handle-availability?handle=api");
    const reservedHandleBody = (await reservedHandleResponse.json()) as { error: string };

    expect(missingHandleResponse.status).toBe(400);
    expect(missingHandleBody).toEqual({ error: "Handle is required." });
    expect(invalidHandleResponse.status).toBe(400);
    expect(invalidHandleBody).toEqual({
      error: "Only letters, numbers, and underscores are allowed.",
    });
    expect(reservedHandleResponse.status).toBe(400);
    expect(reservedHandleBody).toEqual({ error: "This handle is not available." });
    expect(domainCallCount).toBe(0);
  });

  test("checks availability for the authenticated user's normalized handle", async () => {
    const calls: Array<{ handle: string; userId: string }> = [];
    const app = createTestProfilePageApi({
      auth: async () => authenticatedSession,
      isHandleAvailableForUser: async (input) => {
        calls.push(input);
        return false;
      },
    });

    const response = await app.request("/handle-availability?handle=%20Demo_Handle%20");
    const body = (await response.json()) as { available: boolean };

    expect(response.status).toBe(200);
    expect(body).toEqual({ available: false });
    expect(calls).toEqual([{ handle: "demo_handle", userId: "user-1" }]);
  });

  test("maps ProfilePageError and unknown errors to the existing JSON response shapes", async () => {
    const profileErrorApp = createTestProfilePageApi({
      auth: async () => authenticatedSession,
      isHandleAvailableForUser: async () => {
        throw { message: "Profile page not found.", status: 404 };
      },
      isProfilePageError: (error): error is { message: string; status: number } => {
        return typeof error === "object" && error !== null && "status" in error;
      },
    });
    const unknownErrorApp = createTestProfilePageApi({
      auth: async () => authenticatedSession,
      isHandleAvailableForUser: async () => {
        throw new Error("database unavailable");
      },
      logger: {
        error: () => {},
      },
    });

    const profileErrorResponse = await profileErrorApp.request("/handle-availability?handle=demo");
    const profileErrorBody = (await profileErrorResponse.json()) as { error: string };
    const unknownErrorResponse = await unknownErrorApp.request("/handle-availability?handle=demo");
    const unknownErrorBody = (await unknownErrorResponse.json()) as { error: string };

    expect(profileErrorResponse.status).toBe(404);
    expect(profileErrorBody).toEqual({ error: "Profile page not found." });
    expect(unknownErrorResponse.status).toBe(500);
    expect(unknownErrorBody).toEqual({ error: "Failed to check handle availability." });
  });

  test("creates link items from a validated JSON body", async () => {
    const calls: Array<{ userId: string; values: typeof validLinkPayload }> = [];
    const createdLinkItem = {
      ...validLinkPayload,
      id: "link-1",
      position: 0,
    };
    const app = createTestProfilePageApi({
      auth: async () => authenticatedSession,
      createLinkItem: async (input) => {
        calls.push(input);
        return createdLinkItem;
      },
      isHandleAvailableForUser: async () => true,
    });

    const response = await app.request("/links", {
      body: JSON.stringify(validLinkPayload),
      headers: {
        "content-type": "application/json",
      },
      method: "POST",
    });
    const body = (await response.json()) as { linkItem: typeof createdLinkItem };

    expect(response.status).toBe(200);
    expect(body).toEqual({ linkItem: createdLinkItem });
    expect(calls).toEqual([{ userId: "user-1", values: validLinkPayload }]);
  });

  test("validates link item bodies before calling the mutation layer", async () => {
    let mutationCallCount = 0;
    const app = createTestProfilePageApi({
      auth: async () => authenticatedSession,
      createLinkItem: async () => {
        mutationCallCount += 1;
        return {
          ...validLinkPayload,
          id: "link-1",
          position: 0,
        };
      },
      isHandleAvailableForUser: async () => true,
    });

    const response = await app.request("/links", {
      body: JSON.stringify({ ...validLinkPayload, url: "not-a-url" }),
      headers: {
        "content-type": "application/json",
      },
      method: "POST",
    });
    const body = (await response.json()) as { error: string };

    expect(response.status).toBe(400);
    expect(body).toEqual({ error: "Enter a valid URL." });
    expect(mutationCallCount).toBe(0);
  });

  test("maps link item mutation errors to the existing JSON response shapes", async () => {
    const profileErrorApp = createTestProfilePageApi({
      auth: async () => authenticatedSession,
      createLinkItem: async () => {
        throw { message: "Profile page not found.", status: 404 };
      },
      isHandleAvailableForUser: async () => true,
      isProfilePageError: (error): error is { message: string; status: number } => {
        return typeof error === "object" && error !== null && "status" in error;
      },
    });
    const unknownErrorApp = createTestProfilePageApi({
      auth: async () => authenticatedSession,
      createLinkItem: async () => {
        throw new Error("database unavailable");
      },
      isHandleAvailableForUser: async () => true,
      logger: {
        error: () => {},
      },
    });

    const profileErrorResponse = await profileErrorApp.request("/links", {
      body: JSON.stringify(validLinkPayload),
      method: "POST",
    });
    const profileErrorBody = (await profileErrorResponse.json()) as { error: string };
    const unknownErrorResponse = await unknownErrorApp.request("/links", {
      body: JSON.stringify(validLinkPayload),
      method: "POST",
    });
    const unknownErrorBody = (await unknownErrorResponse.json()) as { error: string };

    expect(profileErrorResponse.status).toBe(404);
    expect(profileErrorBody).toEqual({ error: "Profile page not found." });
    expect(unknownErrorResponse.status).toBe(500);
    expect(unknownErrorBody).toEqual({ error: "Failed to create link item." });
  });

  test("updates link items from a validated JSON body and route param", async () => {
    const calls: Array<{ linkId: string; userId: string; values: LinkItemInput }> = [];
    const updatedLinkItem = {
      ...validLinkPayload,
      id: "link-1",
      position: 0,
      title: "Updated",
    };
    const app = createTestProfilePageApi({
      auth: async () => authenticatedSession,
      createLinkItem: async () => ({
        ...validLinkPayload,
        id: "link-1",
        position: 0,
      }),
      isHandleAvailableForUser: async () => true,
      updateLinkItem: async (input) => {
        calls.push(input);
        return updatedLinkItem;
      },
    });

    const response = await app.request("/links/link-1", {
      body: JSON.stringify({ ...validLinkPayload, title: "Updated" }),
      headers: {
        "content-type": "application/json",
      },
      method: "PATCH",
    });
    const body = (await response.json()) as { linkItem: typeof updatedLinkItem };

    expect(response.status).toBe(200);
    expect(body).toEqual({ linkItem: updatedLinkItem });
    expect(calls).toEqual([
      {
        linkId: "link-1",
        userId: "user-1",
        values: { ...validLinkPayload, title: "Updated" },
      },
    ]);
  });

  test("validates link item update bodies before calling the mutation layer", async () => {
    let mutationCallCount = 0;
    const app = createTestProfilePageApi({
      auth: async () => authenticatedSession,
      createLinkItem: async () => ({
        ...validLinkPayload,
        id: "link-1",
        position: 0,
      }),
      isHandleAvailableForUser: async () => true,
      updateLinkItem: async () => {
        mutationCallCount += 1;
        return {
          ...validLinkPayload,
          id: "link-1",
          position: 0,
        };
      },
    });

    const response = await app.request("/links/link-1", {
      body: JSON.stringify({ ...validLinkPayload, url: "not-a-url" }),
      headers: {
        "content-type": "application/json",
      },
      method: "PATCH",
    });
    const body = (await response.json()) as { error: string };

    expect(response.status).toBe(400);
    expect(body).toEqual({ error: "Enter a valid URL." });
    expect(mutationCallCount).toBe(0);
  });

  test("deletes link items from the route param", async () => {
    const calls: Array<{ linkId: string; userId: string }> = [];
    const app = createTestProfilePageApi({
      auth: async () => authenticatedSession,
      createLinkItem: async () => ({
        ...validLinkPayload,
        id: "link-1",
        position: 0,
      }),
      deleteLinkItem: async (input) => {
        calls.push(input);
      },
      isHandleAvailableForUser: async () => true,
    });

    const response = await app.request("/links/link-1", {
      method: "DELETE",
    });
    const body = (await response.json()) as { success: boolean };

    expect(response.status).toBe(200);
    expect(body).toEqual({ success: true });
    expect(calls).toEqual([{ linkId: "link-1", userId: "user-1" }]);
  });

  test("maps link item update and delete errors to the existing JSON response shapes", async () => {
    const profileErrorApp = createTestProfilePageApi({
      auth: async () => authenticatedSession,
      createLinkItem: async () => ({
        ...validLinkPayload,
        id: "link-1",
        position: 0,
      }),
      deleteLinkItem: async () => {
        throw { message: "Link item not found.", status: 404 };
      },
      isHandleAvailableForUser: async () => true,
      isProfilePageError: (error): error is { message: string; status: number } => {
        return typeof error === "object" && error !== null && "status" in error;
      },
      updateLinkItem: async () => {
        throw { message: "Link item not found.", status: 404 };
      },
    });
    const unknownErrorApp = createTestProfilePageApi({
      auth: async () => authenticatedSession,
      createLinkItem: async () => ({
        ...validLinkPayload,
        id: "link-1",
        position: 0,
      }),
      deleteLinkItem: async () => {
        throw new Error("database unavailable");
      },
      isHandleAvailableForUser: async () => true,
      logger: {
        error: () => {},
      },
      updateLinkItem: async () => {
        throw new Error("database unavailable");
      },
    });

    const updateProfileErrorResponse = await profileErrorApp.request("/links/link-1", {
      body: JSON.stringify(validLinkPayload),
      method: "PATCH",
    });
    const updateProfileErrorBody = (await updateProfileErrorResponse.json()) as { error: string };
    const updateUnknownErrorResponse = await unknownErrorApp.request("/links/link-1", {
      body: JSON.stringify(validLinkPayload),
      method: "PATCH",
    });
    const updateUnknownErrorBody = (await updateUnknownErrorResponse.json()) as { error: string };
    const deleteProfileErrorResponse = await profileErrorApp.request("/links/link-1", {
      method: "DELETE",
    });
    const deleteProfileErrorBody = (await deleteProfileErrorResponse.json()) as { error: string };
    const deleteUnknownErrorResponse = await unknownErrorApp.request("/links/link-1", {
      method: "DELETE",
    });
    const deleteUnknownErrorBody = (await deleteUnknownErrorResponse.json()) as { error: string };

    expect(updateProfileErrorResponse.status).toBe(404);
    expect(updateProfileErrorBody).toEqual({ error: "Link item not found." });
    expect(updateUnknownErrorResponse.status).toBe(500);
    expect(updateUnknownErrorBody).toEqual({ error: "Failed to update link item." });
    expect(deleteProfileErrorResponse.status).toBe(404);
    expect(deleteProfileErrorBody).toEqual({ error: "Link item not found." });
    expect(deleteUnknownErrorResponse.status).toBe(500);
    expect(deleteUnknownErrorBody).toEqual({ error: "Failed to delete link item." });
  });

  test("reorders link items from a validated JSON body", async () => {
    const calls: Array<{ orderedIds: string[]; userId: string }> = [];
    const payload: ReorderItemsInput = {
      orderedIds: ["link-2", "link-1"],
    };
    const app = createTestProfilePageApi({
      reorderLinkItems: async (input) => {
        calls.push(input);
      },
    });

    const response = await app.request("/links/reorder", {
      body: JSON.stringify(payload),
      headers: {
        "content-type": "application/json",
      },
      method: "POST",
    });
    const body = (await response.json()) as { success: boolean };

    expect(response.status).toBe(200);
    expect(body).toEqual({ success: true });
    expect(calls).toEqual([{ orderedIds: ["link-2", "link-1"], userId: "user-1" }]);
  });

  test("validates link item reorder bodies before calling the mutation layer", async () => {
    let mutationCallCount = 0;
    const app = createTestProfilePageApi({
      reorderLinkItems: async () => {
        mutationCallCount += 1;
      },
    });

    const response = await app.request("/links/reorder", {
      body: JSON.stringify({ orderedIds: [] }),
      headers: {
        "content-type": "application/json",
      },
      method: "POST",
    });
    const body = (await response.json()) as { error: string };

    expect(response.status).toBe(400);
    expect(body).toEqual({ error: "At least one item is required." });
    expect(mutationCallCount).toBe(0);
  });

  test("maps link item reorder errors to the existing JSON response shapes", async () => {
    const profileErrorApp = createTestProfilePageApi({
      isProfilePageError: (error): error is { message: string; status: number } => {
        return typeof error === "object" && error !== null && "status" in error;
      },
      reorderLinkItems: async () => {
        throw { message: "Ordered IDs do not match current items.", status: 400 };
      },
    });
    const unknownErrorApp = createTestProfilePageApi({
      logger: {
        error: () => {},
      },
      reorderLinkItems: async () => {
        throw new Error("database unavailable");
      },
    });

    const profileErrorResponse = await profileErrorApp.request("/links/reorder", {
      body: JSON.stringify({ orderedIds: ["link-1"] }),
      method: "POST",
    });
    const profileErrorBody = (await profileErrorResponse.json()) as { error: string };
    const unknownErrorResponse = await unknownErrorApp.request("/links/reorder", {
      body: JSON.stringify({ orderedIds: ["link-1"] }),
      method: "POST",
    });
    const unknownErrorBody = (await unknownErrorResponse.json()) as { error: string };

    expect(profileErrorResponse.status).toBe(400);
    expect(profileErrorBody).toEqual({ error: "Ordered IDs do not match current items." });
    expect(unknownErrorResponse.status).toBe(500);
    expect(unknownErrorBody).toEqual({ error: "Failed to reorder link items." });
  });

  test("creates text box items from a validated JSON body", async () => {
    const calls: Array<{ userId: string; values: TextBoxItemInput }> = [];
    const app = createTestProfilePageApi({
      createTextBoxItem: async (input) => {
        calls.push(input);
        return defaultTextBoxItem;
      },
    });

    const response = await app.request("/text", {
      body: JSON.stringify(validTextBoxPayload),
      headers: {
        "content-type": "application/json",
      },
      method: "POST",
    });
    const body = (await response.json()) as { textBoxItem: typeof defaultTextBoxItem };

    expect(response.status).toBe(200);
    expect(body).toEqual({ textBoxItem: defaultTextBoxItem });
    expect(calls).toEqual([{ userId: "user-1", values: validTextBoxPayload }]);
  });

  test("validates text box create bodies before calling the mutation layer", async () => {
    let mutationCallCount = 0;
    const app = createTestProfilePageApi({
      createTextBoxItem: async () => {
        mutationCallCount += 1;
        return defaultTextBoxItem;
      },
    });

    const response = await app.request("/text", {
      body: JSON.stringify({ ...validTextBoxPayload, title: "" }),
      headers: {
        "content-type": "application/json",
      },
      method: "POST",
    });
    const body = (await response.json()) as { error: string };

    expect(response.status).toBe(400);
    expect(body).toEqual({ error: "Title is required." });
    expect(mutationCallCount).toBe(0);
  });

  test("updates text box items from a validated JSON body and route param", async () => {
    const calls: Array<{ textBoxId: string; userId: string; values: TextBoxItemInput }> = [];
    const updatedTextBoxItem = {
      ...defaultTextBoxItem,
      title: "Updated",
    };
    const app = createTestProfilePageApi({
      updateTextBoxItem: async (input) => {
        calls.push(input);
        return updatedTextBoxItem;
      },
    });

    const response = await app.request("/text/text-1", {
      body: JSON.stringify({ ...validTextBoxPayload, title: "Updated" }),
      headers: {
        "content-type": "application/json",
      },
      method: "PATCH",
    });
    const body = (await response.json()) as { textBoxItem: typeof updatedTextBoxItem };

    expect(response.status).toBe(200);
    expect(body).toEqual({ textBoxItem: updatedTextBoxItem });
    expect(calls).toEqual([
      {
        textBoxId: "text-1",
        userId: "user-1",
        values: { ...validTextBoxPayload, title: "Updated" },
      },
    ]);
  });

  test("deletes text box items from the route param", async () => {
    const calls: Array<{ textBoxId: string; userId: string }> = [];
    const app = createTestProfilePageApi({
      deleteTextBoxItem: async (input) => {
        calls.push(input);
      },
    });

    const response = await app.request("/text/text-1", {
      method: "DELETE",
    });
    const body = (await response.json()) as { success: boolean };

    expect(response.status).toBe(200);
    expect(body).toEqual({ success: true });
    expect(calls).toEqual([{ textBoxId: "text-1", userId: "user-1" }]);
  });

  test("reorders text box items from a validated JSON body", async () => {
    const calls: Array<{ orderedIds: string[]; userId: string }> = [];
    const app = createTestProfilePageApi({
      reorderTextBoxItems: async (input) => {
        calls.push(input);
      },
    });

    const response = await app.request("/text/reorder", {
      body: JSON.stringify({ orderedIds: ["text-2", "text-1"] }),
      headers: {
        "content-type": "application/json",
      },
      method: "POST",
    });
    const body = (await response.json()) as { success: boolean };

    expect(response.status).toBe(200);
    expect(body).toEqual({ success: true });
    expect(calls).toEqual([{ orderedIds: ["text-2", "text-1"], userId: "user-1" }]);
  });

  test("maps text box mutation errors to the existing JSON response shapes", async () => {
    const profileErrorApp = createTestProfilePageApi({
      createTextBoxItem: async () => {
        throw { message: "Profile page not found.", status: 404 };
      },
      deleteTextBoxItem: async () => {
        throw { message: "Text box item not found.", status: 404 };
      },
      isProfilePageError: (error): error is { message: string; status: number } => {
        return typeof error === "object" && error !== null && "status" in error;
      },
      reorderTextBoxItems: async () => {
        throw { message: "Ordered IDs do not match current items.", status: 400 };
      },
      updateTextBoxItem: async () => {
        throw { message: "Text box item not found.", status: 404 };
      },
    });
    const unknownErrorApp = createTestProfilePageApi({
      createTextBoxItem: async () => {
        throw new Error("database unavailable");
      },
      deleteTextBoxItem: async () => {
        throw new Error("database unavailable");
      },
      logger: {
        error: () => {},
      },
      reorderTextBoxItems: async () => {
        throw new Error("database unavailable");
      },
      updateTextBoxItem: async () => {
        throw new Error("database unavailable");
      },
    });

    const createProfileErrorResponse = await profileErrorApp.request("/text", {
      body: JSON.stringify(validTextBoxPayload),
      method: "POST",
    });
    const createProfileErrorBody = (await createProfileErrorResponse.json()) as { error: string };
    const createUnknownErrorResponse = await unknownErrorApp.request("/text", {
      body: JSON.stringify(validTextBoxPayload),
      method: "POST",
    });
    const createUnknownErrorBody = (await createUnknownErrorResponse.json()) as { error: string };
    const updateProfileErrorResponse = await profileErrorApp.request("/text/text-1", {
      body: JSON.stringify(validTextBoxPayload),
      method: "PATCH",
    });
    const updateProfileErrorBody = (await updateProfileErrorResponse.json()) as { error: string };
    const updateUnknownErrorResponse = await unknownErrorApp.request("/text/text-1", {
      body: JSON.stringify(validTextBoxPayload),
      method: "PATCH",
    });
    const updateUnknownErrorBody = (await updateUnknownErrorResponse.json()) as { error: string };
    const deleteProfileErrorResponse = await profileErrorApp.request("/text/text-1", {
      method: "DELETE",
    });
    const deleteProfileErrorBody = (await deleteProfileErrorResponse.json()) as { error: string };
    const deleteUnknownErrorResponse = await unknownErrorApp.request("/text/text-1", {
      method: "DELETE",
    });
    const deleteUnknownErrorBody = (await deleteUnknownErrorResponse.json()) as { error: string };
    const reorderProfileErrorResponse = await profileErrorApp.request("/text/reorder", {
      body: JSON.stringify({ orderedIds: ["text-1"] }),
      method: "POST",
    });
    const reorderProfileErrorBody = (await reorderProfileErrorResponse.json()) as { error: string };
    const reorderUnknownErrorResponse = await unknownErrorApp.request("/text/reorder", {
      body: JSON.stringify({ orderedIds: ["text-1"] }),
      method: "POST",
    });
    const reorderUnknownErrorBody = (await reorderUnknownErrorResponse.json()) as { error: string };

    expect(createProfileErrorResponse.status).toBe(404);
    expect(createProfileErrorBody).toEqual({ error: "Profile page not found." });
    expect(createUnknownErrorResponse.status).toBe(500);
    expect(createUnknownErrorBody).toEqual({ error: "Failed to create text box item." });
    expect(updateProfileErrorResponse.status).toBe(404);
    expect(updateProfileErrorBody).toEqual({ error: "Text box item not found." });
    expect(updateUnknownErrorResponse.status).toBe(500);
    expect(updateUnknownErrorBody).toEqual({ error: "Failed to update text box item." });
    expect(deleteProfileErrorResponse.status).toBe(404);
    expect(deleteProfileErrorBody).toEqual({ error: "Text box item not found." });
    expect(deleteUnknownErrorResponse.status).toBe(500);
    expect(deleteUnknownErrorBody).toEqual({ error: "Failed to delete text box item." });
    expect(reorderProfileErrorResponse.status).toBe(400);
    expect(reorderProfileErrorBody).toEqual({ error: "Ordered IDs do not match current items." });
    expect(reorderUnknownErrorResponse.status).toBe(500);
    expect(reorderUnknownErrorBody).toEqual({ error: "Failed to reorder text box items." });
  });

  test("reads profile page editor data with the optional handle query", async () => {
    const calls: Array<{ handle?: string; userId: string }> = [];
    const app = createTestProfilePageApi({
      getProfilePageEditorData: async (userId, handle) => {
        calls.push({ handle, userId });
        return defaultProfilePageData;
      },
    });

    const response = await app.request("/?handle=demo");
    const body = (await response.json()) as typeof defaultProfilePageData;

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body).toEqual({
      ...defaultProfilePageData,
      page: {
        ...defaultProfilePageData.page,
        updatedAt: "2026-05-02T00:00:00.000Z",
      },
    });
    expect(calls).toEqual([{ handle: "demo", userId: "user-1" }]);
  });

  test("returns the existing not found response when profile page editor data is missing", async () => {
    const app = createTestProfilePageApi({
      getProfilePageEditorData: async () => null,
    });

    const response = await app.request("/");
    const body = (await response.json()) as { error: string };

    expect(response.status).toBe(404);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body).toEqual({ error: "Profile page not found." });
  });

  test("updates profile metadata from a validated JSON body", async () => {
    const calls: Array<{ userId: string; values: ProfilePageUpdateValues }> = [];
    const app = createTestProfilePageApi({
      updateProfileMetadata: async (input) => {
        calls.push(input);
        return defaultProfilePageData.page;
      },
    });

    const response = await app.request("/", {
      body: JSON.stringify(validProfilePagePayload),
      headers: {
        "content-type": "application/json",
      },
      method: "PATCH",
    });
    const body = (await response.json()) as { page: typeof defaultProfilePageData.page };

    expect(response.status).toBe(200);
    expect(body).toEqual({
      page: {
        ...defaultProfilePageData.page,
        updatedAt: "2026-05-02T00:00:00.000Z",
      },
    });
    expect(calls).toEqual([{ userId: "user-1", values: validProfilePagePayload }]);
  });

  test("validates profile metadata bodies before calling the mutation layer", async () => {
    let mutationCallCount = 0;
    const app = createTestProfilePageApi({
      updateProfileMetadata: async () => {
        mutationCallCount += 1;
        return defaultProfilePageData.page;
      },
    });

    const response = await app.request("/", {
      body: JSON.stringify({ ...validProfilePagePayload, name: "" }),
      headers: {
        "content-type": "application/json",
      },
      method: "PATCH",
    });
    const body = (await response.json()) as { error: string };

    expect(response.status).toBe(400);
    expect(body).toEqual({ error: "Name is required." });
    expect(mutationCallCount).toBe(0);
  });

  test("maps profile metadata update errors to the existing JSON response shapes", async () => {
    const profileErrorApp = createTestProfilePageApi({
      isProfilePageError: (error): error is { message: string; status: number } => {
        return typeof error === "object" && error !== null && "status" in error;
      },
      updateProfileMetadata: async () => {
        throw { message: "This handle is already taken.", status: 409 };
      },
    });
    const unknownErrorApp = createTestProfilePageApi({
      logger: {
        error: () => {},
      },
      updateProfileMetadata: async () => {
        throw new Error("database unavailable");
      },
    });

    const profileErrorResponse = await profileErrorApp.request("/", {
      body: JSON.stringify(validProfilePagePayload),
      method: "PATCH",
    });
    const profileErrorBody = (await profileErrorResponse.json()) as { error: string };
    const unknownErrorResponse = await unknownErrorApp.request("/", {
      body: JSON.stringify(validProfilePagePayload),
      method: "PATCH",
    });
    const unknownErrorBody = (await unknownErrorResponse.json()) as { error: string };

    expect(profileErrorResponse.status).toBe(409);
    expect(profileErrorBody).toEqual({ error: "This handle is already taken." });
    expect(unknownErrorResponse.status).toBe(500);
    expect(unknownErrorBody).toEqual({ error: "Failed to update profile page." });
  });

  test("syncs profile page drafts from a validated JSON body and revalidates the public path", async () => {
    const syncCalls: Array<{ userId: string; values: ProfilePageSyncValues }> = [];
    const revalidateCalls: string[] = [];
    const app = createTestProfilePageApi({
      revalidatePath: (path) => {
        revalidateCalls.push(path);
      },
      syncProfilePageDraft: async (input) => {
        syncCalls.push(input);
        return defaultProfilePageData;
      },
    });

    const response = await app.request("/sync", {
      body: JSON.stringify(validProfilePageSyncPayload),
      headers: {
        "content-type": "application/json",
      },
      method: "POST",
    });
    const body = (await response.json()) as typeof defaultProfilePageData;

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body).toEqual({
      ...defaultProfilePageData,
      page: {
        ...defaultProfilePageData.page,
        updatedAt: "2026-05-02T00:00:00.000Z",
      },
    });
    expect(syncCalls).toEqual([{ userId: "user-1", values: validProfilePageSyncPayload }]);
    expect(revalidateCalls).toEqual(["/demo"]);
  });

  test("validates profile page sync bodies before calling the mutation layer", async () => {
    let mutationCallCount = 0;
    const app = createTestProfilePageApi({
      syncProfilePageDraft: async () => {
        mutationCallCount += 1;
        return defaultProfilePageData;
      },
    });

    const response = await app.request("/sync", {
      body: JSON.stringify({
        ...validProfilePageSyncPayload,
        page: {
          ...validProfilePageSyncPayload.page,
          name: "",
        },
      }),
      headers: {
        "content-type": "application/json",
      },
      method: "POST",
    });
    const body = (await response.json()) as { error: string };

    expect(response.status).toBe(400);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body).toEqual({ error: "Failed to sync" });
    expect(mutationCallCount).toBe(0);
  });

  test("maps profile page sync errors to the existing JSON response shapes", async () => {
    const profileErrorApp = createTestProfilePageApi({
      isProfilePageError: (error): error is { message: string; status: number } => {
        return typeof error === "object" && error !== null && "status" in error;
      },
      syncProfilePageDraft: async () => {
        throw { message: "This handle is already taken.", status: 409 };
      },
    });
    const unknownErrorApp = createTestProfilePageApi({
      logger: {
        error: () => {},
      },
      syncProfilePageDraft: async () => {
        throw new Error("database unavailable");
      },
    });

    const profileErrorResponse = await profileErrorApp.request("/sync", {
      body: JSON.stringify(validProfilePageSyncPayload),
      method: "POST",
    });
    const profileErrorBody = (await profileErrorResponse.json()) as { error: string };
    const unknownErrorResponse = await unknownErrorApp.request("/sync", {
      body: JSON.stringify(validProfilePageSyncPayload),
      method: "POST",
    });
    const unknownErrorBody = (await unknownErrorResponse.json()) as { error: string };

    expect(profileErrorResponse.status).toBe(409);
    expect(profileErrorResponse.headers.get("cache-control")).toBe("no-store");
    expect(profileErrorBody).toEqual({ error: "This handle is already taken." });
    expect(unknownErrorResponse.status).toBe(500);
    expect(unknownErrorResponse.headers.get("cache-control")).toBe("no-store");
    expect(unknownErrorBody).toEqual({ error: "Failed to sync" });
  });

  test("syncs profile bento drafts from a validated JSON body and revalidates the public path", async () => {
    const syncCalls: Array<{ userId: string; values: ProfileBentoSyncValues }> = [];
    const revalidateCalls: string[] = [];
    const app = createTestProfilePageApi({
      revalidatePath: (path) => {
        revalidateCalls.push(path);
      },
      syncProfileBentoDraft: async (input) => {
        syncCalls.push(input);
        return defaultProfileBentoData;
      },
    });

    const response = await app.request("/bento/sync", {
      body: JSON.stringify(validProfileBentoSyncPayload),
      headers: {
        "content-type": "application/json",
      },
      method: "POST",
    });
    const body = (await response.json()) as typeof defaultProfileBentoData;

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body).toEqual(defaultProfileBentoData);
    expect(syncCalls).toEqual([{ userId: "user-1", values: validProfileBentoSyncPayload }]);
    expect(revalidateCalls).toEqual(["/demo"]);
  });

  test("validates profile bento sync bodies before calling the mutation layer", async () => {
    let mutationCallCount = 0;
    const app = createTestProfilePageApi({
      syncProfileBentoDraft: async () => {
        mutationCallCount += 1;
        return defaultProfileBentoData;
      },
    });

    const response = await app.request("/bento/sync", {
      body: JSON.stringify({
        bento: [
          {
            ...validProfileBentoSyncPayload.bento[0],
            content: {
              ...validProfileBentoSyncPayload.bento[0].content,
              url: "not-a-url",
            },
          },
        ],
      }),
      headers: {
        "content-type": "application/json",
      },
      method: "POST",
    });
    const body = (await response.json()) as { description: string; error: string };

    expect(response.status).toBe(400);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body).toEqual({
      description: "bento.0.content.url: Enter a valid URL.",
      error: "Failed to sync bento",
    });
    expect(mutationCallCount).toBe(0);
  });

  test("maps profile bento sync errors to the existing JSON response shapes", async () => {
    const profileErrorApp = createTestProfilePageApi({
      isProfilePageError: (error): error is { message: string; status: number } => {
        return typeof error === "object" && error !== null && "status" in error;
      },
      syncProfileBentoDraft: async () => {
        throw { message: "Profile page not found.", status: 404 };
      },
    });
    const unknownErrorApp = createTestProfilePageApi({
      logger: {
        error: () => {},
      },
      syncProfileBentoDraft: async () => {
        throw new Error("database unavailable");
      },
    });

    const profileErrorResponse = await profileErrorApp.request("/bento/sync", {
      body: JSON.stringify(validProfileBentoSyncPayload),
      method: "POST",
    });
    const profileErrorBody = (await profileErrorResponse.json()) as { error: string };
    const unknownErrorResponse = await unknownErrorApp.request("/bento/sync", {
      body: JSON.stringify(validProfileBentoSyncPayload),
      method: "POST",
    });
    const unknownErrorBody = (await unknownErrorResponse.json()) as { error: string };

    expect(profileErrorResponse.status).toBe(404);
    expect(profileErrorResponse.headers.get("cache-control")).toBe("no-store");
    expect(profileErrorBody).toEqual({ error: "Profile page not found." });
    expect(unknownErrorResponse.status).toBe(500);
    expect(unknownErrorResponse.headers.get("cache-control")).toBe("no-store");
    expect(unknownErrorBody).toEqual({ error: "Failed to sync bento" });
  });

  test("creates profile image upload fields with a stable user storage key", async () => {
    const uploadCalls: Array<{ contentType?: string; maxSize?: number; path: string }> = [];
    const app = createTestProfilePageApi({
      createS3UploadFields: async (input) => {
        uploadCalls.push(input);
        return {
          fields: {
            "Content-Type": input.contentType ?? "",
          },
          url: "https://storage.example.com",
        };
      },
      getPublicS3ObjectUrl: (key) => `https://cdn.example.com/${key}`,
    });

    const response = await app.request("/upload-image", {
      body: JSON.stringify({
        fileName: "avatar.png",
        fileSize: 1024,
        fileType: "image/png",
        imageHash: "a".repeat(64),
        imageKind: "profile",
      }),
      headers: {
        "content-type": "application/json",
      },
      method: "POST",
    });
    const body = (await response.json()) as {
      fields: Record<string, string>;
      publicUrl: string;
      url: string;
    };

    expect(response.status).toBe(200);
    expect(body).toEqual({
      fields: {
        "Content-Type": "image/png",
      },
      publicUrl: `https://cdn.example.com/public/users/user-1/profile-page/profile?v=${"a".repeat(
        64
      )}`,
      url: "https://storage.example.com",
    });
    expect(uploadCalls).toEqual([
      {
        contentType: "image/png",
        maxSize: 5 * 1024 * 1024,
        path: "public/users/user-1/profile-page/profile",
      },
    ]);
  });

  test("validates profile image upload requests before creating upload fields", async () => {
    let uploadCallCount = 0;
    const app = createTestProfilePageApi({
      createS3UploadFields: async () => {
        uploadCallCount += 1;
        return {
          fields: {},
          url: "https://storage.example.com",
        };
      },
    });

    const response = await app.request("/upload-image", {
      body: JSON.stringify({
        fileName: "avatar.gif",
        fileSize: 1024,
        fileType: "image/gif",
        imageHash: "a".repeat(64),
        imageKind: "profile",
      }),
      headers: {
        "content-type": "application/json",
      },
      method: "POST",
    });
    const body = (await response.json()) as { error: string };

    expect(response.status).toBe(400);
    expect(body).toEqual({ error: "Upload a JPEG, PNG, WebP, or AVIF image." });
    expect(uploadCallCount).toBe(0);
  });

  test("finalizes and deletes profile images for the authenticated user's storage prefix", async () => {
    const finalizedUrl =
      "https://cdn.example.com/public/users/user-1/profile-page/background?v=final";
    const deletedUrls: string[] = [];
    const updateCalls: Array<{
      imageKind: "background" | "profile";
      imageUrl: string;
      userId: string;
    }> = [];
    const app = createTestProfilePageApi({
      deletePublicS3Object: async (url) => {
        deletedUrls.push(url);
        return true;
      },
      getS3ObjectKeyFromPublicUrl: (url) => new URL(url).pathname.replace(/^\/+/, ""),
      updateProfileImage: async (input) => {
        updateCalls.push(input);
        return {
          backgroundImage: input.imageKind === "background" ? input.imageUrl : null,
          image: input.imageKind === "profile" ? input.imageUrl : null,
        };
      },
    });

    const finalizeResponse = await app.request("/upload-image", {
      body: JSON.stringify({
        imageKind: "background",
        imageUrl: finalizedUrl,
      }),
      headers: {
        "content-type": "application/json",
      },
      method: "PATCH",
    });
    const finalizeBody = (await finalizeResponse.json()) as { imageUrl: string | null };
    const deleteResponse = await app.request("/upload-image", {
      body: JSON.stringify({
        imageUrl: finalizedUrl,
      }),
      headers: {
        "content-type": "application/json",
      },
      method: "DELETE",
    });
    const deleteBody = (await deleteResponse.json()) as { success: boolean };

    expect(finalizeResponse.status).toBe(200);
    expect(finalizeBody).toEqual({ imageUrl: finalizedUrl });
    expect(updateCalls).toEqual([
      {
        imageKind: "background",
        imageUrl: finalizedUrl,
        userId: "user-1",
      },
    ]);
    expect(deleteResponse.status).toBe(200);
    expect(deleteBody).toEqual({ success: true });
    expect(deletedUrls).toEqual([finalizedUrl]);
  });

  test("uploads profile bento media to a temporary object and returns the public preview URL", async () => {
    const putCalls: Array<{ body: Buffer; contentType: string; objectKey: string }> = [];
    const app = createTestProfilePageApi({
      getTemporaryProfileBentoMediaObjectKey: ({ bentoId, userId }) =>
        `tmp/users/${userId}/profile-page/bento/${bentoId}/media-temp`,
      putTemporaryProfileBentoMediaObject: async (input) => {
        putCalls.push(input);
      },
    });
    const formData = new FormData();
    formData.set("bentoId", "bento-1");
    formData.set("file", new File(["image-bytes"], "work.png", { type: "image/png" }));

    const response = await app.request("/bento/media/upload", {
      body: formData,
      method: "POST",
    });
    const body = (await response.json()) as {
      contentHash: string;
      contentType: string;
      mediaType: string;
      tempObjectKey: string;
      tempUrl: string;
    };

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(/^[a-f0-9]{64}$/.test(body.contentHash)).toBe(true);
    expect(body.contentType).toBe("image/png");
    expect(body.mediaType).toBe("image");
    expect(body.tempObjectKey).toBe("tmp/users/user-1/profile-page/bento/bento-1/media-temp");
    expect(body.tempUrl).toBe(
      `https://media.example.com/tmp/users/user-1/profile-page/bento/bento-1/media-temp?v=${body.contentHash}`
    );
    expect(putCalls).toHaveLength(1);
    expect(putCalls[0]?.contentType).toBe("image/png");
    expect(putCalls[0]?.objectKey).toBe("tmp/users/user-1/profile-page/bento/bento-1/media-temp");
  });

  test("validates profile bento media upload form data before storing objects", async () => {
    let putCallCount = 0;
    const app = createTestProfilePageApi({
      putTemporaryProfileBentoMediaObject: async () => {
        putCallCount += 1;
      },
    });
    const formData = new FormData();
    formData.set("bentoId", "bento-1");
    formData.set("file", new File(["plain text"], "note.txt", { type: "text/plain" }));

    const response = await app.request("/bento/media/upload", {
      body: formData,
      method: "POST",
    });
    const body = (await response.json()) as { error: string };

    expect(response.status).toBe(400);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body).toEqual({ error: "이미지 또는 비디오 파일만 추가할 수 있어요." });
    expect(putCallCount).toBe(0);
  });
});
