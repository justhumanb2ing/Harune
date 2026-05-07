import { describe, expect, test } from "bun:test";
import { fetchUrlMetadata, MetadataFetchError } from "@/lib/metadata/url-metadata";

describe("fetchUrlMetadata", () => {
  test("fetches normalized metadata from the harune metadata API", async () => {
    const originalFetch = globalThis.fetch;
    let requestUrl = "";
    let requestHeaders: HeadersInit | undefined;

    globalThis.fetch = (async (input, init) => {
      requestUrl = String(input);
      requestHeaders = init?.headers;

      return new Response(
        JSON.stringify({
          canonicalUrl: "https://example.com/canonical",
          description: "Page description",
          favicon: "https://example.com/favicon.ico",
          image: "https://example.com/og.png",
          siteName: "Example Site",
          title: "OG Title",
          url: "https://example.com/post",
        }),
        {
          headers: {
            "content-type": "application/json",
          },
        }
      );
    }) as typeof fetch;

    try {
      const metadata = await fetchUrlMetadata("https://example.com/post");
      const headers = new Headers(requestHeaders);

      expect(requestUrl).toBe(
        "https://api.harune.me/metadata?url=https%3A%2F%2Fexample.com%2Fpost"
      );
      expect(headers.get("accept")).toBe("application/json");
      expect(metadata).toEqual({
        canonicalUrl: "https://example.com/canonical",
        description: "Page description",
        favicon: "https://example.com/favicon.ico",
        image: "https://example.com/og.png",
        siteName: "Example Site",
        title: "OG Title",
        url: "https://example.com/post",
      });
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test("surfaces metadata API errors with the upstream status", async () => {
    const originalFetch = globalThis.fetch;

    globalThis.fetch = (async () =>
      new Response(
        JSON.stringify({
          error: "invalid_url",
          message: "Invalid URL.",
          details: {
            url: "notaurl",
          },
        }),
        {
          headers: {
            "content-type": "application/json",
          },
          status: 400,
        }
      )) as typeof fetch;

    try {
      let error: unknown;

      try {
        await fetchUrlMetadata("notaurl");
      } catch (caughtError) {
        error = caughtError;
      }

      expect(error).toBeInstanceOf(MetadataFetchError);
      expect(error).toEqual(
        expect.objectContaining({
          status: 400,
          body: {
            error: "invalid_url",
            message: "Invalid URL.",
            details: {
              url: "notaurl",
            },
          },
        })
      );
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test("normalizes nested metadata API errors", async () => {
    const originalFetch = globalThis.fetch;

    globalThis.fetch = (async () =>
      new Response(
        JSON.stringify({
          error: {
            code: "bad_gateway",
            message: "target responded with an error status",
            details: {
              status: 429,
            },
          },
        }),
        {
          headers: {
            "content-type": "application/json",
          },
          status: 502,
        }
      )) as typeof fetch;

    try {
      let error: unknown;

      try {
        await fetchUrlMetadata("https://music.youtube.com/watch?v=tlcEurH9Cpg");
      } catch (caughtError) {
        error = caughtError;
      }

      expect(error).toBeInstanceOf(MetadataFetchError);
      expect(error).toEqual(
        expect.objectContaining({
          status: 502,
          body: {
            error: "bad_gateway",
            message: "target responded with an error status",
            details: {
              status: 429,
            },
          },
        })
      );
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
