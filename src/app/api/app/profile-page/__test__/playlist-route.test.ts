import { describe, expect, test } from "bun:test";
import { GET } from "@/app/api/app/profile-page/playlist/route";

describe("playlist route handler", () => {
  test("proxies iframely responses through the app origin", async () => {
    const upstreamPayload = {
      meta: {
        title: "Today’s Top Hits",
        site: "Spotify",
      },
      html: '<iframe src="https://example.com/embed"></iframe>',
    };

    const originalFetch = globalThis.fetch;
    const fetchCalls: Array<{ input: RequestInfo | URL; init?: RequestInit }> = [];
    const fetchMock = async (input: RequestInfo | URL, init?: RequestInit) => {
      fetchCalls.push({ input, init });
      return new Response(JSON.stringify(upstreamPayload), {
        status: 200,
        headers: {
          "content-type": "application/json",
        },
      });
    };

    globalThis.fetch = fetchMock as typeof fetch;

    let response: Response;
    let body: typeof upstreamPayload;
    try {
      response = await GET(
        new Request("http://localhost/api/app/profile-page/playlist?url=https%3A%2F%2Fexample.com")
      );
      body = (await response.json()) as typeof upstreamPayload;
    } finally {
      globalThis.fetch = originalFetch;
    }

    if (!response || !body) {
      throw new Error("Test setup failed");
    }

    expect(response.status).toBe(200);
    expect(body).toEqual(upstreamPayload);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(fetchCalls).toHaveLength(1);
    expect(String(fetchCalls[0]?.input).includes("https://iframe.bybu.cc/iframely")).toBe(true);
    expect(String(fetchCalls[0]?.input).includes("url=https%3A%2F%2Fexample.com")).toBe(true);
  });

  test("rejects invalid urls before fetching upstream", async () => {
    const originalFetch = globalThis.fetch;
    let fetchCount = 0;
    globalThis.fetch = (async () => {
      fetchCount += 1;
      return new Response(null, { status: 200 });
    }) as typeof fetch;

    let response: Response;
    let body: { error: string };
    try {
      response = await GET(
        new Request("http://localhost/api/app/profile-page/playlist?url=not-a-url")
      );
      body = (await response.json()) as { error: string };
    } finally {
      globalThis.fetch = originalFetch;
    }

    if (!response || !body) {
      throw new Error("Test setup failed");
    }

    expect(response.status).toBe(400);
    expect(body.error).toBe("Invalid URL.");
    expect(fetchCount).toBe(0);
  });
});
