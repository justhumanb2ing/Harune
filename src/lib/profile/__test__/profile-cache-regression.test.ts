import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { profilePageQueryOptions } from "@/lib/profile/query-options";
import { meQueryOptions } from "@/lib/users/queries";
import { profileBentoSyncSchema } from "@/lib/validations/profile-content.schema";

const jsonResponse = (body: unknown) =>
  new Response(JSON.stringify(body), {
    headers: {
      "content-type": "application/json",
    },
  });

describe("profile page cache regression", () => {
  test("client profile reads bypass browser fetch cache", async () => {
    const originalFetch = globalThis.fetch;
    const fetchCalls: Array<{ init?: RequestInit; input: RequestInfo | URL }> = [];
    globalThis.fetch = ((input, init) => {
      fetchCalls.push({ input, init });
      return Promise.resolve(jsonResponse(null));
    }) as typeof fetch;

    try {
      const query = profilePageQueryOptions("demo");
      await (query.queryFn as (context: { signal?: AbortSignal }) => Promise<unknown>)({});
    } finally {
      globalThis.fetch = originalFetch;
    }

    expect(fetchCalls[0]?.input).toBe("/api/profile?handle=demo");
    expect(fetchCalls[0]?.init?.cache).toBe("no-store");
  });

  test("client me reads bypass browser fetch cache", async () => {
    const originalFetch = globalThis.fetch;
    const fetchCalls: Array<{ init?: RequestInit; input: RequestInfo | URL }> = [];
    globalThis.fetch = ((input, init) => {
      fetchCalls.push({ input, init });
      return Promise.resolve(
        jsonResponse({
          currentPlan: null,
          profilePage: null,
          user: {
            id: "user-1",
            email: "user@example.com",
            name: "User",
            image: null,
          },
        })
      );
    }) as typeof fetch;

    try {
      const query = meQueryOptions();
      await (query.queryFn as (context: { signal?: AbortSignal }) => Promise<unknown>)({});
    } finally {
      globalThis.fetch = originalFetch;
    }

    expect(fetchCalls[0]?.input).toBe("/api/me");
    expect(fetchCalls[0]?.init?.cache).toBe("no-store");
  });

  test("public profile reads use explicit Next data cache instead of React request memoization", () => {
    const source = readFileSync(join(process.cwd(), "src/lib/profile/queries.ts"), "utf8");

    expect(source.includes('from "react"')).toBe(false);
    expect(source.includes("cache(async")).toBe(false);
    expect(source.includes("unstable_cache")).toBe(true);
    expect(source.includes("PUBLIC_PROFILE_BENTO_CACHE_TAG")).toBe(true);
  });

  test("bento sync response is built from a committed DB read", () => {
    const source = readFileSync(join(process.cwd(), "src/lib/profile/mutations.ts"), "utf8");
    const start = source.indexOf("export const syncProfileBentoDraft");
    const end = source.indexOf("export const syncProfilePageDraft");
    const bentoSyncSource = source.slice(start, end);
    const transactionIndex = bentoSyncSource.indexOf("await db.transaction");
    const committedReadIndex = bentoSyncSource.indexOf(
      "const nextData = await getPublicProfileBentoPageByPageId(db, ownedPage.id);"
    );

    expect(transactionIndex >= 0).toBe(true);
    expect(committedReadIndex > transactionIndex).toBe(true);
  });

  test("profile sync response is built from a committed DB read", () => {
    const source = readFileSync(join(process.cwd(), "src/lib/profile/mutations.ts"), "utf8");
    const start = source.indexOf("export const syncProfilePageDraft");
    const profileSyncSource = source.slice(start);
    const transactionIndex = profileSyncSource.indexOf("await db.transaction");
    const committedReadIndex = profileSyncSource.indexOf(
      "const nextData = await getProfilePageEditorDataByPageId(db, ownedPage.id);"
    );

    expect(transactionIndex >= 0).toBe(true);
    expect(committedReadIndex > transactionIndex).toBe(true);
  });

  test("/api/profile returns the editor data shape expected by the client store", () => {
    const source = readFileSync(
      join(process.cwd(), "src/lib/api/services/profile-server.ts"),
      "utf8"
    );

    expect(source.includes("getProfilePageEditorData,")).toBe(true);
    expect(source.includes("getProfilePageEditorApiData")).toBe(false);
  });

  test("bento media child table participates in sync write and public read paths", () => {
    const mutationSource = readFileSync(
      join(process.cwd(), "src/lib/profile/mutations.ts"),
      "utf8"
    );
    const querySource = readFileSync(join(process.cwd(), "src/lib/profile/queries.ts"), "utf8");

    expect(mutationSource.includes("profileMediaBentos")).toBe(true);
    expect(mutationSource.includes("prepareMediaBentoContent")).toBe(true);
    expect(querySource.includes("profileMediaBentos")).toBe(true);
    expect(querySource.includes('item.type === "media"')).toBe(true);
  });

  test("bento map child table participates in sync write and public read paths", () => {
    const mutationSource = readFileSync(
      join(process.cwd(), "src/lib/profile/mutations.ts"),
      "utf8"
    );
    const querySource = readFileSync(join(process.cwd(), "src/lib/profile/queries.ts"), "utf8");

    expect(mutationSource.includes("profileMapBentos")).toBe(true);
    expect(querySource.includes("profileMapBentos")).toBe(true);
    expect(querySource.includes('item.type === "map"')).toBe(true);
  });

  test("link bento sync accepts long metadata descriptions without storing them", () => {
    const mutationSource = readFileSync(
      join(process.cwd(), "src/lib/profile/mutations.ts"),
      "utf8"
    );
    const result = profileBentoSyncSchema.safeParse({
      bento: [
        {
          id: "link-1",
          type: "link",
          layout: {
            desktop: { x: 0, y: 0, w: 2, h: 2 },
            compact: { x: 0, y: 0, w: 2, h: 2 },
          },
          content: {
            title: "Long metadata link",
            description: "a".repeat(1000),
            favicon: "",
            thumbnail: "",
            url: "https://example.com",
          },
        },
      ],
    });

    expect(result.success).toBe(true);
    expect(mutationSource.includes("description: null")).toBe(true);
    expect(mutationSource.includes("description: item.content.description || null")).toBe(false);
  });
});
