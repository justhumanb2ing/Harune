import { describe, expect, test } from "bun:test";
import { createRootApi } from "@/lib/api/routes/root";

const authenticatedSession = {
  expires: "2026-05-02T00:00:00.000Z",
  user: {
    email: "creator@example.com",
    id: "user-1",
  },
};

type RootApiOptions = Parameters<typeof createRootApi>[0];

const createTestRootApi = (overrides: Partial<RootApiOptions> = {}) =>
  createRootApi({
    auth: async () => authenticatedSession,
    getProfilePageByHandle: async () => null,
    getSafeRedirectPath: (path) => path ?? "/app",
    logger: {
      error: () => {},
    },
    resolveAuthenticatedAppRedirect: async () => "/demo",
    ...overrides,
  });

describe("root Hono API", () => {
  test("checks global handle availability through the shared Hono API", async () => {
    const calls: string[] = [];
    const app = createTestRootApi({
      getProfilePageByHandle: async (handle) => {
        calls.push(handle);
        return { id: "page-1" };
      },
    });

    const response = await app.request("/api/handle/availability?handle=demo");
    const body = (await response.json()) as { available: boolean };

    expect(response.status).toBe(200);
    expect(body).toEqual({ available: false });
    expect(calls).toEqual(["demo"]);
  });

  test("validates global handle availability requests", async () => {
    let queryCallCount = 0;
    const app = createTestRootApi({
      getProfilePageByHandle: async () => {
        queryCallCount += 1;
        return null;
      },
    });

    const response = await app.request("/api/handle/availability?handle=bad-handle");
    const body = (await response.json()) as { error: string };

    expect(response.status).toBe(400);
    expect(body.error.length > 0).toBe(true);
    expect(queryCallCount).toBe(0);
  });

  test("redirects anonymous join requests to sign-in with a safe callback path", async () => {
    let authCallCount = 0;
    const app = createTestRootApi({
      auth: async () => {
        authCallCount += 1;
        return null;
      },
      getSafeRedirectPath: (path) => `/safe${path}`,
    });

    const response = await app.request("/api/join?handle=demo");

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "/sign-in?callbackUrl=%2Fsafe%2Fapi%2Fjoin%3Fhandle%3Ddemo"
    );
    expect(authCallCount).toBe(0);
  });

  test("redirects authenticated join requests to the resolved app destination", async () => {
    const calls: Array<{ handle?: string; next?: string; userId: string }> = [];
    const app = createTestRootApi({
      resolveAuthenticatedAppRedirect: async (input) => {
        calls.push(input);
        return "/demo/analytics";
      },
    });

    const response = await app.request("/api/join?handle=demo&next=%2Fanalytics", {
      headers: {
        cookie: "better-auth.session_token=token",
      },
    });

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("/demo/analytics");
    expect(calls).toEqual([
      {
        handle: "demo",
        next: "/analytics",
        userId: "user-1",
      },
    ]);
  });

  test("reads the session only after a session cookie signal exists", async () => {
    let authCallCount = 0;
    const app = createTestRootApi({
      auth: async () => {
        authCallCount += 1;
        return authenticatedSession;
      },
      resolveAuthenticatedAppRedirect: async () => "/demo/analytics",
    });

    const response = await app.request("/api/join?handle=demo", {
      headers: {
        cookie: "better-auth.session_token=token",
      },
    });

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("/demo/analytics");
    expect(authCallCount).toBe(1);
  });
});
