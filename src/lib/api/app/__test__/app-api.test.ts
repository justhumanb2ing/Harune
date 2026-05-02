import { describe, expect, test } from "bun:test";
import type { ProfileUpdateValues } from "@/lib/validations/profile.schema";
import { createAppApi } from "../app";

const authenticatedSession = {
  expires: "2026-05-02T00:00:00.000Z",
  user: {
    email: "creator@example.com",
    id: "user-1",
  },
};

const defaultMeResponse = {
  currentPlan: null,
  profilePage: null,
  user: {
    createdAt: new Date("2026-05-02T00:00:00.000Z"),
    credits: 0,
    dodoCustomerId: null,
    dodoSubscriptionId: null,
    email: "creator@example.com",
    emailVerified: null,
    emailVerifiedBool: false,
    id: "user-1",
    image: null,
    lemonSqueezyCustomerId: null,
    lemonSqueezySubscriptionId: null,
    name: "Creator",
    paddleCustomerId: null,
    paddleSubscriptionId: null,
    planId: null,
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    updatedAt: new Date("2026-05-02T00:00:00.000Z"),
  },
};

type AppApiOptions = Parameters<typeof createAppApi>[0];

const createTestAppApi = (overrides: Partial<AppApiOptions> = {}) =>
  createAppApi({
    auth: async () => authenticatedSession,
    getMeForUser: async () => defaultMeResponse,
    logger: {
      error: () => {},
    },
    updateUserProfile: async ({ image, name }) => ({
      ...defaultMeResponse.user,
      image: image ?? null,
      name,
    }),
    ...overrides,
  });

describe("app Hono API", () => {
  test("returns the existing unauthorized JSON contract when the session is missing", async () => {
    const app = createTestAppApi({
      auth: async () => null,
    });

    const response = await app.request("/me");
    const body = (await response.json()) as { error: string; message: string };

    expect(response.status).toBe(401);
    expect(body).toEqual({
      error: "Unauthorized",
      message: "You are not authorized to perform this action",
    });
  });

  test("reads the current user response for the authenticated session", async () => {
    const calls: string[] = [];
    const app = createTestAppApi({
      getMeForUser: async (userId) => {
        calls.push(userId);
        return defaultMeResponse;
      },
    });

    const response = await app.request("/me");
    const body = (await response.json()) as typeof defaultMeResponse;

    expect(response.status).toBe(200);
    expect(body).toEqual({
      ...defaultMeResponse,
      user: {
        ...defaultMeResponse.user,
        createdAt: "2026-05-02T00:00:00.000Z",
        updatedAt: "2026-05-02T00:00:00.000Z",
      },
    });
    expect(calls).toEqual(["user-1"]);
  });

  test("updates the current user profile from a validated JSON body", async () => {
    const calls: Array<{ userId: string; values: ProfileUpdateValues }> = [];
    const app = createTestAppApi({
      updateUserProfile: async (input) => {
        calls.push(input);
        return {
          ...defaultMeResponse.user,
          image: input.values.image ?? null,
          name: input.values.name,
        };
      },
    });

    const response = await app.request("/me", {
      body: JSON.stringify({
        image: "https://example.com/avatar.png",
        name: "Updated",
      }),
      headers: {
        "content-type": "application/json",
      },
      method: "PATCH",
    });
    const body = (await response.json()) as { message: string; user: unknown };

    expect(response.status).toBe(200);
    expect(body).toEqual({
      message: "Profile updated successfully",
      user: {
        ...defaultMeResponse.user,
        createdAt: "2026-05-02T00:00:00.000Z",
        image: "https://example.com/avatar.png",
        name: "Updated",
        updatedAt: "2026-05-02T00:00:00.000Z",
      },
    });
    expect(calls).toEqual([
      {
        userId: "user-1",
        values: {
          image: "https://example.com/avatar.png",
          name: "Updated",
        },
      },
    ]);
  });

  test("validates current user profile updates before calling the mutation layer", async () => {
    let mutationCallCount = 0;
    const app = createTestAppApi({
      updateUserProfile: async () => {
        mutationCallCount += 1;
        return defaultMeResponse.user;
      },
    });

    const response = await app.request("/me", {
      body: JSON.stringify({
        image: "not-a-url",
        name: "",
      }),
      headers: {
        "content-type": "application/json",
      },
      method: "PATCH",
    });
    const body = (await response.json()) as { details: unknown[]; error: string };

    expect(response.status).toBe(400);
    expect(body.error).toBe("Validation failed");
    expect(body.details.length).toBeGreaterThan(0);
    expect(mutationCallCount).toBe(0);
  });

  test("maps current user profile update misses and unknown errors", async () => {
    const notFoundApp = createTestAppApi({
      updateUserProfile: async () => null,
    });
    const unknownErrorApp = createTestAppApi({
      updateUserProfile: async () => {
        throw new Error("database unavailable");
      },
    });

    const notFoundResponse = await notFoundApp.request("/me", {
      body: JSON.stringify({ name: "Updated" }),
      method: "PATCH",
    });
    const notFoundBody = (await notFoundResponse.json()) as { error: string };
    const unknownErrorResponse = await unknownErrorApp.request("/me", {
      body: JSON.stringify({ name: "Updated" }),
      method: "PATCH",
    });
    const unknownErrorBody = (await unknownErrorResponse.json()) as { error: string };

    expect(notFoundResponse.status).toBe(404);
    expect(notFoundBody).toEqual({ error: "User not found" });
    expect(unknownErrorResponse.status).toBe(500);
    expect(unknownErrorBody).toEqual({ error: "Failed to update profile" });
  });
});
