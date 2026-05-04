import { describe, expect, test } from "bun:test";
import { createRootApi } from "../app";

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
    fetchUrlMetadata: async (url) => ({
      description: "Description",
      favicon: null,
      image: null,
      readMode: "head",
      sitename: "Example",
      title: "Example",
      url,
    }),
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

  test("fetches URL metadata with no-store headers", async () => {
    const calls: string[] = [];
    const app = createTestRootApi({
      fetchUrlMetadata: async (url) => {
        calls.push(url);
        return {
          description: null,
          favicon: null,
          image: "https://example.com/image.png",
          readMode: "head",
          sitename: "Example",
          title: "Example title",
          url,
        };
      },
    });

    const response = await app.request("/api/crawl?url=https%3A%2F%2Fexample.com%2Fpost");
    const body = (await response.json()) as { image: string; title: string; url: string };

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body).toEqual({
      description: null,
      favicon: null,
      image: "https://example.com/image.png",
      readMode: "head",
      sitename: "Example",
      title: "Example title",
      url: "https://example.com/post",
    });
    expect(calls).toEqual(["https://example.com/post"]);
  });

  test("maps URL metadata validation and upstream errors", async () => {
    const missingUrlApp = createTestRootApi();
    const invalidUrlApp = createTestRootApi({
      fetchUrlMetadata: async () => {
        throw new Error("Invalid URL.");
      },
    });
    const upstreamErrorApp = createTestRootApi({
      fetchUrlMetadata: async () => {
        throw new Error("metadata fetch failed");
      },
    });

    const missingUrlResponse = await missingUrlApp.request("/api/crawl");
    const invalidUrlResponse = await invalidUrlApp.request("/api/crawl?url=notaurl");
    const upstreamErrorResponse = await upstreamErrorApp.request(
      "/api/crawl?url=https%3A%2F%2Fexample.com"
    );

    expect(missingUrlResponse.status).toBe(400);
    expect(missingUrlResponse.headers.get("cache-control")).toBe("no-store");
    expect(await missingUrlResponse.json()).toEqual({ error: "Missing URL." });
    expect(invalidUrlResponse.status).toBe(400);
    expect(await invalidUrlResponse.json()).toEqual({ error: "Invalid URL." });
    expect(upstreamErrorResponse.status).toBe(502);
    expect(await upstreamErrorResponse.json()).toEqual({ error: "metadata fetch failed" });
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
