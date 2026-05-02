import { describe, expect, test } from "bun:test";
import { createProfilePageApi } from "../app";

const authenticatedSession = {
  expires: "2026-05-02T00:00:00.000Z",
  user: {
    email: "creator@example.com",
    id: "user-1",
  },
};

describe("profile page Hono API", () => {
  const validLinkPayload = {
    description: "A useful link",
    favicon: "https://example.com/favicon.ico",
    title: "Example",
    url: "https://example.com",
  };

  test("returns the existing unauthorized JSON contract when the session is missing", async () => {
    const app = createProfilePageApi({
      auth: async () => null,
      createLinkItem: async () => ({
        ...validLinkPayload,
        id: "link-1",
        position: 0,
      }),
      isHandleAvailableForUser: async () => true,
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
    const app = createProfilePageApi({
      auth: async () => authenticatedSession,
      createLinkItem: async () => ({
        ...validLinkPayload,
        id: "link-1",
        position: 0,
      }),
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
    const app = createProfilePageApi({
      auth: async () => authenticatedSession,
      createLinkItem: async () => ({
        ...validLinkPayload,
        id: "link-1",
        position: 0,
      }),
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
    const profileErrorApp = createProfilePageApi({
      auth: async () => authenticatedSession,
      createLinkItem: async () => ({
        ...validLinkPayload,
        id: "link-1",
        position: 0,
      }),
      isHandleAvailableForUser: async () => {
        throw { message: "Profile page not found.", status: 404 };
      },
      isProfilePageError: (error): error is { message: string; status: number } => {
        return typeof error === "object" && error !== null && "status" in error;
      },
    });
    const unknownErrorApp = createProfilePageApi({
      auth: async () => authenticatedSession,
      createLinkItem: async () => ({
        ...validLinkPayload,
        id: "link-1",
        position: 0,
      }),
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
    const app = createProfilePageApi({
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
    const app = createProfilePageApi({
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
    const profileErrorApp = createProfilePageApi({
      auth: async () => authenticatedSession,
      createLinkItem: async () => {
        throw { message: "Profile page not found.", status: 404 };
      },
      isHandleAvailableForUser: async () => true,
      isProfilePageError: (error): error is { message: string; status: number } => {
        return typeof error === "object" && error !== null && "status" in error;
      },
    });
    const unknownErrorApp = createProfilePageApi({
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
});
