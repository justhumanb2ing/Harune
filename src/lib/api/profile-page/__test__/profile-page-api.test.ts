import { describe, expect, test } from "bun:test";
import type { LinkItemInput, ReorderItemsInput } from "@/lib/validations/profile-page.schema";
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

type ProfilePageApiOptions = Parameters<typeof createProfilePageApi>[0];

const createTestProfilePageApi = (overrides: Partial<ProfilePageApiOptions> = {}) =>
  createProfilePageApi({
    auth: async () => authenticatedSession,
    createLinkItem: async () => defaultLinkItem,
    deleteLinkItem: async () => {},
    isHandleAvailableForUser: async () => true,
    reorderLinkItems: async () => {},
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
});
