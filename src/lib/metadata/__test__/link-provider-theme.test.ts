import { describe, expect, test } from "bun:test";
import { resolveLinkProviderTheme } from "@/lib/metadata/link-provider-theme";

describe("resolveLinkProviderTheme", () => {
  const cases = [
    ["https://youtube.com/watch?v=abc", "youtube", "#fff2f5", "Subscribe", "#ff0033", "#ffffff"],
    ["https://discord.gg/abc123", "discord", "#f2f3ff", "Join", "#5865f2", "#ffffff"],
    ["https://github.com/leeve/leeve", "github", "#ffffff", "Follow", "#f6f8fa", "#000000", true],
    ["https://x.com/leeve/status/1", "x", "#f7f7f7", "Follow", "#000000", "#ffffff"],
    ["https://open.spotify.com/track/abc", "spotify", "#f0fbf4", "Play", "#1ED760", "#ffffff"],
    ["https://spotify.link/abc123", "spotify", "#f0fbf4", "Play", "#1ED760", "#ffffff"],
    ["https://threads.net/@leeve", "threads", "#ffffff"],
    ["https://www.instagram.com/leeve", "instagram", "#ffffff", "Follow", "#3797f0", "#ffffff"],
    ["https://buymeacoffee.com/leeve", "buymeacoffee", "#fffbe5"],
    ["https://linkedin.com/in/leeve", "linkedin", "#f0f7ff", "Connect", "#0a66c2", "#ffffff"],
    ["https://chzzk.naver.com/live/abc", "chzzk", "#ffffff"],
    ["https://figma.com/file/abc", "figma", "#ffffff"],
    ["https://ko-fi.com/leeve", "kofi", "#eefaff", "Support", "#29abe0", "#ffffff"],
    ["https://gumroad.com/l/leeve", "gumroad", "#fff2fc"],
    ["https://medium.com/@leeve/post", "medium", "#ffffff"],
    ["https://patreon.com/leeve", "patreon", "#ffffff", "Join", "#71a0ff", "#ffffff"],
    [
      "https://producthunt.com/products/leeve",
      "producthunt",
      "#fff4f0",
      "View",
      "#da552f",
      "#ffffff",
    ],
    ["https://reddit.com/r/leeve", "reddit", "#fff2ed", "Join", "#ff4500", "#ffffff"],
    ["https://tiktok.com/@leeve", "tiktok", "#ffffff"],
    ["https://twitch.tv/leeve", "twitch", "#f7f2ff"],
    ["https://behance.net/leeve", "behance", "#f0f5ff"],
    ["https://dribbble.com/leeve", "dribbble", "#fff2f7", "Follow", "#ea4c89", "#ffffff"],
  ] as const;

  for (const [
    url,
    provider,
    color,
    actionLabel,
    actionBackgroundColor,
    actionForegroundColor,
    isOutlineButton = false,
  ] of cases) {
    test(`resolves ${url}`, () => {
      const theme = resolveLinkProviderTheme(url);

      expect(theme?.backgroundColor).toBe(color);
      expect(theme?.foregroundColor).toBe("#111111");
      expect(theme?.provider).toBe(provider);
      if (actionLabel) {
        expect(theme?.actionLabel).toBe(actionLabel);
        expect(theme?.actionBackgroundColor).toBe(actionBackgroundColor);
        expect(theme?.actionForegroundColor).toBe(actionForegroundColor);
        expect(theme?.isOutlineButton).toBe(isOutlineButton);
      } else {
        expect(typeof theme?.actionLabel).toBe("string");
        expect(typeof theme?.actionBackgroundColor).toBe("string");
        expect(["#000000", "#ffffff"].includes(theme?.actionForegroundColor ?? "")).toBe(true);
        expect(theme?.isOutlineButton).toBe(false);
      }
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
