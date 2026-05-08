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
    getSafeRedirectPath: (path) => path ?? "/app",
    logger: {
      error: () => {},
    },
    resolveAuthenticatedAppRedirect: async () => "/demo",
    ...overrides,
  });

describe("root Hono API", () => {
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
