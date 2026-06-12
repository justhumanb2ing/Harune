import { describe, expect, test } from "bun:test";

import {
  getBackgroundColorOption,
  normalizeGridTextSurfaceStyle,
  normalizeHexColorInput,
} from "@/components/profile/grid/grid-text-surface";

describe("grid text surface color", () => {
  test("normalizes hex color input", () => {
    expect(normalizeHexColorInput("#ffffff")).toBe("#ffffff");
    expect(normalizeHexColorInput("fff")).toBe("#ffffff");
    expect(normalizeHexColorInput("#ABC123")).toBe("#abc123");
    expect(normalizeHexColorInput("not-a-color")).toBeNull();
  });

  test("preserves custom hex background colors in surface style", () => {
    expect(
      normalizeGridTextSurfaceStyle({
        backgroundColor: "#123abc",
        textAlign: "center",
        verticalAlign: "end",
      })
    ).toEqual({
      backgroundColor: "#123abc",
      textAlign: "center",
      verticalAlign: "end",
    });
  });

  test("uses contrast-aware foreground for custom colors", () => {
    expect(getBackgroundColorOption("#111111")).toMatchObject({
      id: "custom",
      value: "#111111",
      foregroundClassName: "text-white",
    });
    expect(getBackgroundColorOption("#f8fafc")).toMatchObject({
      id: "custom",
      value: "#f8fafc",
      foregroundClassName: "text-black",
    });
  });
});
