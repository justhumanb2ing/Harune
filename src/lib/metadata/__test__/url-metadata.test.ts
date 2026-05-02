import { describe, expect, test } from "bun:test";
import { fetchUrlMetadata } from "@/lib/metadata/url-metadata";

describe("fetchUrlMetadata", () => {
  test("extracts open graph metadata and resolves relative URLs", async () => {
    const originalFetch = globalThis.fetch;

    globalThis.fetch = (async () =>
      new Response(
        `<!doctype html>
        <html>
          <head>
            <title>Fallback title</title>
            <meta property="og:title" content="OG Title &amp; More">
            <meta name="description" content="Page description">
            <meta property="og:site_name" content="Example Site">
            <meta property="og:image" content="/og.png">
            <link rel="icon" sizes="32x32" href="/favicon.ico">
            <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
            <link rel="canonical" href="/canonical">
          </head>
        </html>`,
        {
          headers: {
            "content-type": "text/html",
          },
        }
      )) as typeof fetch;

    try {
      const metadata = await fetchUrlMetadata("https://example.com/post");

      expect(metadata).toEqual({
        title: "OG Title & More",
        description: "Page description",
        sitename: "Example Site",
        image: "https://example.com/og.png",
        favicon: "https://example.com/apple-touch-icon.png",
        url: "https://example.com/canonical",
        readMode: "head",
      });
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test("reads the full document when the head exceeds the byte limit", async () => {
    const originalFetch = globalThis.fetch;
    const oversizedHeadPadding = " ".repeat(140 * 1024);

    globalThis.fetch = (async () =>
      new Response(
        `<!doctype html>
        <html>
          <head>
            <meta property="og:title" content="Early Title">
            <meta name="description" content="Early description">
            ${oversizedHeadPadding}
            <meta property="og:image" content="/late.png">
          </head>
        </html>`,
        {
          headers: {
            "content-type": "text/html",
          },
        }
      )) as typeof fetch;

    try {
      const metadata = await fetchUrlMetadata("https://example.com/post");

      expect(metadata.title).toBe("Early Title");
      expect(metadata.description).toBe("Early description");
      expect(metadata.image).toBe("https://example.com/late.png");
      expect(metadata.favicon).toBe("https://example.com/favicon.ico");
      expect(metadata.url).toBe("https://example.com/post");
      expect(metadata.readMode).toBe("document");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test("rejects unsupported protocols before fetch", async () => {
    let errorMessage = "";

    try {
      await fetchUrlMetadata("file:///etc/passwd");
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : "";
    }

    expect(errorMessage).toBe("Only HTTP and HTTPS URLs are supported.");
  });
});
