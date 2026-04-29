import { describe, expect, test } from "bun:test";
import { resolvePlaylistProvider } from "@/lib/profile-page/playlist";

describe("resolvePlaylistProvider", () => {
  test("accepts apple music site variants from iframely", () => {
    expect(resolvePlaylistProvider("Apple Music")).toBe("Apple Music - 웹 플레이어");
    expect(resolvePlaylistProvider("Apple Music - 웹 플레이어")).toBe("Apple Music - 웹 플레이어");
    expect(resolvePlaylistProvider("Apple\u00a0Music - 웹 플레이어")).toBe(
      "Apple Music - 웹 플레이어"
    );
  });
});
