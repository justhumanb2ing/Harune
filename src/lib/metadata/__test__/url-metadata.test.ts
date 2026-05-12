import { describe, expect, test } from "bun:test";
import {
  fetchUrlMetadata,
  formatCompactCount,
  isGithubContributionsProviderMetadata,
  isYoutubeProviderMetadata,
  MetadataFetchError,
} from "@/lib/metadata/url-metadata";

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
          fetchedAt: "2026-05-12T00:00:00.000Z",
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
        provider: null,
        providerMetadata: null,
      });
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test("preserves github contribution metadata", async () => {
    const originalFetch = globalThis.fetch;

    globalThis.fetch = (async () =>
      new Response(
        JSON.stringify({
          canonicalUrl: "https://github.com/octocat",
          description: "GitHub profile",
          favicon: "https://github.com/favicon.ico",
          fetchedAt: "2026-05-12T00:00:00.000Z",
          image: null,
          siteName: "GitHub",
          title: "octocat",
          url: "https://github.com/octocat",
          provider: "github",
          providerMetadata: {
            provider: "github",
            viewType: "github_contributions_60d",
            fetchedAt: "2026-05-12T00:00:00.000Z",
            payload: {
              login: "octocat",
              name: "The Octocat",
              avatarUrl: "https://avatars.githubusercontent.com/u/583231?v=4",
              profileUrl: "https://github.com/octocat",
              rangeStart: "2026-04-12",
              rangeEnd: "2026-05-12",
              totalContributions: 128,
              days: [
                {
                  date: "2026-04-12",
                  contributionCount: 0,
                  contributionLevel: "NONE",
                  color: "#ebedf0",
                  weekday: 0,
                },
                {
                  date: "2026-04-13",
                  contributionCount: 3,
                  contributionLevel: "FIRST_QUARTILE",
                  color: "#9be9a8",
                  weekday: 1,
                },
              ],
            },
          },
        }),
        {
          headers: {
            "content-type": "application/json",
          },
        }
      )) as typeof fetch;

    try {
      const metadata = await fetchUrlMetadata("https://github.com/octocat");

      expect(metadata.provider).toBe("github");
      expect(isGithubContributionsProviderMetadata(metadata.providerMetadata)).toBe(true);
      expect(metadata.providerMetadata).toEqual({
        provider: "github",
        viewType: "github_contributions_60d",
        fetchedAt: "2026-05-12T00:00:00.000Z",
        payload: {
          login: "octocat",
          name: "The Octocat",
          avatarUrl: "https://avatars.githubusercontent.com/u/583231?v=4",
          profileUrl: "https://github.com/octocat",
          rangeStart: "2026-04-12",
          rangeEnd: "2026-05-12",
          totalContributions: 128,
          days: [
            {
              date: "2026-04-12",
              contributionCount: 0,
              contributionLevel: "NONE",
              color: "#ebedf0",
              weekday: 0,
            },
            {
              date: "2026-04-13",
              contributionCount: 3,
              contributionLevel: "FIRST_QUARTILE",
              color: "#9be9a8",
              weekday: 1,
            },
          ],
        },
      });
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test("preserves youtube provider metadata and compacts subscriber counts", async () => {
    const originalFetch = globalThis.fetch;

    globalThis.fetch = (async () =>
      new Response(
        JSON.stringify({
          canonicalUrl: "https://www.youtube.com/@harune",
          description: "YouTube channel",
          favicon: "https://www.youtube.com/favicon.ico",
          fetchedAt: "2026-05-12T00:00:00.000Z",
          image: "https://i.ytimg.com/vi/abc/hqdefault.jpg",
          siteName: "YouTube",
          title: "Harune",
          url: "https://www.youtube.com/@harune",
          provider: "youtube",
          providerMetadata: {
            provider: "youtube",
            viewType: "youtube_channel",
            fetchedAt: "2026-05-12T00:00:00.000Z",
            payload: {
              snippet: {
                title: "Harune",
                description: "YouTube channel",
                thumbnails: {
                  high: {
                    url: "https://i.ytimg.com/vi/abc/hqdefault.jpg",
                  },
                },
              },
              thumbnails: {
                high: {
                  url: "https://i.ytimg.com/vi/abc/hqdefault.jpg",
                },
              },
              statistics: {
                subscriberCount: "1253400",
              },
            },
          },
        }),
        {
          headers: {
            "content-type": "application/json",
          },
        }
      )) as typeof fetch;

    try {
      const metadata = await fetchUrlMetadata("https://www.youtube.com/@harune");

      expect(metadata.provider).toBe("youtube");
      expect(isYoutubeProviderMetadata(metadata.providerMetadata)).toBe(true);
      expect(metadata.providerMetadata).toEqual({
        provider: "youtube",
        viewType: "youtube_channel",
        fetchedAt: "2026-05-12T00:00:00.000Z",
        payload: {
          snippet: {
            title: "Harune",
            description: "YouTube channel",
            thumbnails: {
              high: {
                url: "https://i.ytimg.com/vi/abc/hqdefault.jpg",
              },
            },
          },
          thumbnails: {
            high: {
              url: "https://i.ytimg.com/vi/abc/hqdefault.jpg",
            },
          },
          statistics: {
            subscriberCount: "1253400",
          },
        },
      });
      expect(formatCompactCount("999")).toBe("999");
      expect(formatCompactCount("1000")).toBe("1K");
      expect(formatCompactCount("1253400")).toBe("1.3M");
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

      expect(error instanceof MetadataFetchError).toBe(true);

      const metadataError = error as MetadataFetchError;

      expect(metadataError.status).toBe(400);
      expect(metadataError.body).toEqual({
        error: "invalid_url",
        message: "Invalid URL.",
        details: {
          url: "notaurl",
        },
      });
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

      expect(error instanceof MetadataFetchError).toBe(true);

      const metadataError = error as MetadataFetchError;

      expect(metadataError.status).toBe(502);
      expect(metadataError.body).toEqual({
        error: "bad_gateway",
        message: "target responded with an error status",
        details: {
          status: 429,
        },
      });
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
