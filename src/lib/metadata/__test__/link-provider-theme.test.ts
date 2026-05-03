import { describe, expect, test } from "bun:test";
import { resolveLinkProviderTheme } from "@/lib/metadata/link-provider-theme";

describe("resolveLinkProviderTheme", () => {
  const cases = [
    ["https://threads.net/@leeve", "threads", "#f7f7f7"],
    ["https://www.instagram.com/leeve", "instagram", "#fff1f5"],
    ["https://buymeacoffee.com/leeve", "buymeacoffee", "#fffbe5"],
    ["https://linkedin.com/in/leeve", "linkedin", "#f0f7ff"],
    ["https://chzzk.naver.com/live/abc", "chzzk", "#effff9"],
    ["https://figma.com/file/abc", "figma", "#f7f2ff"],
    ["https://ko-fi.com/leeve", "kofi", "#eefaff"],
    ["https://gumroad.com/l/leeve", "gumroad", "#fff2fc"],
    ["https://medium.com/@leeve/post", "medium", "#f7f7f7"],
    ["https://patreon.com/leeve", "patreon", "#fff1f2"],
    ["https://producthunt.com/products/leeve", "producthunt", "#fff4f0"],
    ["https://reddit.com/r/leeve", "reddit", "#fff2ed"],
    ["https://tiktok.com/@leeve", "tiktok", "#f7f7f7"],
    ["https://twitch.tv/leeve", "twitch", "#f7f2ff"],
    ["https://behance.net/leeve", "behance", "#f0f5ff"],
    ["https://dribbble.com/leeve", "dribbble", "#fff2f7"],
  ] as const;

  for (const [url, provider, color] of cases) {
    test(`resolves ${url}`, () => {
      const theme = resolveLinkProviderTheme(url);

      expect(theme?.backgroundColor).toBe(color);
      expect(theme?.foregroundColor).toBe("#111111");
      expect(theme?.provider).toBe(provider);
    });
  }

  test("matches nested provider subdomains", () => {
    expect(resolveLinkProviderTheme("https://m.youtube.com/watch?v=abc")?.provider).toBe("youtube");
  });

  test("returns null for unknown or invalid urls", () => {
    expect(resolveLinkProviderTheme("https://example.com/post")).toBe(null);
    expect(resolveLinkProviderTheme("notaurl")).toBe(null);
  });
});
