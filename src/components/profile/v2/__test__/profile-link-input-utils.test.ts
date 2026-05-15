import { describe, expect, test } from "bun:test";

import { normalizeLinkInputUrl } from "@/components/profile/v2/profile-link-input-utils";

describe("profile-link-input-utils", () => {
  test("adds https protocol to bare urls", () => {
    expect(normalizeLinkInputUrl("example.com")).toBe("https://example.com");
  });

  test("keeps urls that already include a protocol", () => {
    expect(normalizeLinkInputUrl("https://example.com")).toBe("https://example.com");
    expect(normalizeLinkInputUrl("http://example.com")).toBe("http://example.com");
  });

  test("trims surrounding whitespace before normalization", () => {
    expect(normalizeLinkInputUrl("  example.com/path  ")).toBe("https://example.com/path");
  });
});
