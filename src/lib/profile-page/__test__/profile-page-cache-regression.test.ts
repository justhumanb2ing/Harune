import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { profilePageQueryOptions } from "@/lib/profile-page/query-options";
import { meQueryOptions } from "@/lib/users/queries";

const jsonResponse = (body: unknown) =>
  new Response(JSON.stringify(body), {
    headers: {
      "content-type": "application/json",
    },
  });

describe("profile page cache regression", () => {
  test("client profile-page reads bypass browser fetch cache", async () => {
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

    expect(fetchCalls[0]?.input).toBe("/api/app/profile-page?handle=demo");
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

    expect(fetchCalls[0]?.input).toBe("/api/app/me");
    expect(fetchCalls[0]?.init?.cache).toBe("no-store");
  });

  test("public profile DB reads are not memoized across requests", () => {
    const source = readFileSync(join(process.cwd(), "src/lib/profile-page/queries.ts"), "utf8");

    expect(source.includes('from "react"')).toBe(false);
    expect(source.includes("cache(async")).toBe(false);
  });

  test("bento sync response is built from a committed DB read", () => {
    const source = readFileSync(join(process.cwd(), "src/lib/profile-page/mutations.ts"), "utf8");
    const start = source.indexOf("export const syncProfileBentoDraft");
    const end = source.indexOf("export const syncProfilePageDraft");
    const bentoSyncSource = source.slice(start, end);

    expect(bentoSyncSource.includes("db.transaction")).toBe(false);
    expect(
      bentoSyncSource.includes(
        "const nextData = await getPublicProfileBentoPageByPageId(db, ownedPage.id);"
      )
    ).toBe(true);
  });

  test("bento media child table participates in sync write and public read paths", () => {
    const mutationSource = readFileSync(
      join(process.cwd(), "src/lib/profile-page/mutations.ts"),
      "utf8"
    );
    const querySource = readFileSync(
      join(process.cwd(), "src/lib/profile-page/queries.ts"),
      "utf8"
    );

    expect(mutationSource.includes("profileMediaBentos")).toBe(true);
    expect(mutationSource.includes("prepareMediaBentoContent")).toBe(true);
    expect(querySource.includes("profileMediaBentos")).toBe(true);
    expect(querySource.includes('item.type === "media"')).toBe(true);
  });
});
