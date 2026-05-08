import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { MeResponse } from "@/lib/api/app/types";
import { createAppApi } from "@/lib/api/routes/app";
import type { OnboardingInput } from "@/lib/validations/auth.schema";
import type { ProfileUpdateValues } from "@/lib/validations/profile.schema";

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
    credits: {},
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
} satisfies MeResponse;

const validOnboardingPayload: OnboardingInput = {
  handle: "demo",
  name: "Demo",
  socialLinks: {},
};

type AppApiOptions = Parameters<typeof createAppApi>[0];

const createTestAppApi = (overrides: Partial<AppApiOptions> = {}) =>
  createAppApi({
    auth: async () => authenticatedSession,
    createS3UploadFields: async ({ contentType }) => ({
      fields: {
        "Content-Type": contentType ?? "",
      },
      url: "https://storage.example.com",
    }),
    getMissingS3ConfigKeys: () => [],
    getPublicS3ObjectUrl: (key) => `https://cdn.example.com/${key}`,
    getMeForUser: async () => defaultMeResponse,
    createProfilePage: async () => ({
      handle: "demo",
      id: "page-1",
      name: "Demo",
    }),
    getProfilePageByHandle: async () => null,
    getUserExists: async () => true,
    logger: {
      error: () => {},
    },
    updateUserProfile: async ({ values }) => ({
      ...defaultMeResponse.user,
      image: values.image ?? null,
      name: values.name,
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
    expect(body.details.length > 0).toBe(true);
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

  test("creates avatar upload fields for authenticated users", async () => {
    const uploadCalls: Array<{ contentType?: string; maxSize?: number; path: string }> = [];
    const app = createTestAppApi({
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

    const response = await app.request("/me/upload-avatar", {
      body: JSON.stringify({
        fileName: "avatar.png",
        fileSize: 1024,
        fileType: "image/png",
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
    expect(body.fields).toEqual({ "Content-Type": "image/png" });
    expect(body.publicUrl.startsWith("https://cdn.example.com/public/users/user-1/avatars/")).toBe(
      true
    );
    expect(body.url).toBe("https://storage.example.com");
    expect(uploadCalls).toHaveLength(1);
    expect(uploadCalls[0]?.contentType).toBe("image/png");
    expect(uploadCalls[0]?.maxSize).toBe(5 * 1024 * 1024);
    expect(uploadCalls[0]?.path.startsWith("public/users/user-1/avatars/")).toBe(true);
  });

  test("validates avatar upload requests before creating upload fields", async () => {
    let uploadCallCount = 0;
    const app = createTestAppApi({
      createS3UploadFields: async () => {
        uploadCallCount += 1;
        return { fields: {}, url: "https://storage.example.com" };
      },
    });

    const response = await app.request("/me/upload-avatar", {
      body: JSON.stringify({
        fileName: "avatar.txt",
        fileSize: 1024,
        fileType: "text/plain",
      }),
      headers: {
        "content-type": "application/json",
      },
      method: "POST",
    });
    const body = (await response.json()) as { error: string };

    expect(response.status).toBe(400);
    expect(body).toEqual({ error: "Only image files are allowed for avatars" });
    expect(uploadCallCount).toBe(0);
  });

  test("creates generic input image upload fields for authenticated users", async () => {
    const uploadCalls: Array<{ contentType?: string; maxSize?: number; path: string }> = [];
    const app = createTestAppApi({
      createS3UploadFields: async (input) => {
        uploadCalls.push(input);
        return {
          fields: {
            "Content-Type": input.contentType ?? "",
          },
          url: "https://storage.example.com",
        };
      },
    });

    const response = await app.request("/upload-input-images", {
      body: JSON.stringify({
        fileName: "input.webp",
        fileSize: 2048,
        fileType: "image/webp",
      }),
      headers: {
        "content-type": "application/json",
      },
      method: "POST",
    });
    const body = (await response.json()) as {
      fields: Record<string, string>;
      url: string;
    };

    expect(response.status).toBe(200);
    expect(body).toEqual({
      fields: {
        "Content-Type": "image/webp",
      },
      url: "https://storage.example.com",
    });
    expect(uploadCalls).toHaveLength(1);
    expect(uploadCalls[0]?.contentType).toBe("image/webp");
    expect(uploadCalls[0]?.maxSize).toBe(2048);
    expect(uploadCalls[0]?.path.startsWith("public/users/user-1/images/")).toBe(true);
  });

  test("validates generic input image upload requests before creating upload fields", async () => {
    let uploadCallCount = 0;
    const app = createTestAppApi({
      createS3UploadFields: async () => {
        uploadCallCount += 1;
        return { fields: {}, url: "https://storage.example.com" };
      },
    });

    const response = await app.request("/upload-input-images", {
      body: JSON.stringify({
        fileName: "input.txt",
        fileSize: 2048,
        fileType: "text/plain",
      }),
      headers: {
        "content-type": "application/json",
      },
      method: "POST",
    });
    const body = (await response.json()) as { error: string };

    expect(response.status).toBe(400);
    expect(body).toEqual({ error: "Only image files are allowed" });
    expect(uploadCallCount).toBe(0);
  });

  test("creates profile pages from validated onboarding payloads", async () => {
    const calls: Array<{ userId: string; values: OnboardingInput }> = [];
    const app = createTestAppApi({
      createProfilePage: async (input) => {
        calls.push(input);
        return {
          handle: input.values.handle,
          id: "page-1",
          name: input.values.name,
        };
      },
    });

    const response = await app.request("/create", {
      body: JSON.stringify(validOnboardingPayload),
      headers: {
        "content-type": "application/json",
      },
      method: "POST",
    });
    const body = (await response.json()) as {
      page: { handle: string; id: string; name: string };
      success: boolean;
    };

    expect(response.status).toBe(200);
    expect(body).toEqual({
      page: {
        handle: "demo",
        id: "page-1",
        name: "Demo",
      },
      success: true,
    });
    expect(calls).toEqual([{ userId: "user-1", values: validOnboardingPayload }]);
  });

  test("keeps /api/create success responses backed by a post-transaction committed read", () => {
    const source = readFileSync(join(process.cwd(), "src/lib/api/repositories/app.ts"), "utf8");

    expect(source.includes("const pageId = await db.transaction")).toBe(true);
    expect(source.includes("const committedPage = await db")).toBe(true);
    expect(source.includes("where(eq(profilePages.id, pageId))")).toBe(true);
    expect(source.includes("Profile page was not found after create.")).toBe(true);
  });

  test("preserves onboarding user, validation, and handle conflict errors", async () => {
    const missingUserApp = createTestAppApi({
      getUserExists: async () => false,
    });
    const invalidPayloadApp = createTestAppApi();
    const conflictApp = createTestAppApi({
      getProfilePageByHandle: async () => ({ id: "existing-page" }),
    });

    const missingUserResponse = await missingUserApp.request("/create", {
      body: JSON.stringify(validOnboardingPayload),
      method: "POST",
    });
    const missingUserBody = (await missingUserResponse.json()) as { error: string };
    const invalidPayloadResponse = await invalidPayloadApp.request("/create", {
      body: JSON.stringify({ ...validOnboardingPayload, name: "" }),
      method: "POST",
    });
    const invalidPayloadBody = (await invalidPayloadResponse.json()) as { error: string };
    const conflictResponse = await conflictApp.request("/create", {
      body: JSON.stringify(validOnboardingPayload),
      method: "POST",
    });
    const conflictBody = (await conflictResponse.json()) as { error: string };

    expect(missingUserResponse.status).toBe(404);
    expect(missingUserBody).toEqual({ error: "User not found" });
    expect(invalidPayloadResponse.status).toBe(400);
    expect(invalidPayloadBody).toEqual({ error: "Name is required." });
    expect(conflictResponse.status).toBe(409);
    expect(conflictBody).toEqual({ error: "This handle is already taken." });
  });
});
