import { describe, expect, test } from "bun:test";

import { getSafeRedirectPath, resolveAppRedirectPath } from "@/lib/auth/app-redirect-paths";

describe("app redirect helpers", () => {
  test("keeps internal callback paths", () => {
    expect(getSafeRedirectPath("/create")).toBe("/create");
    expect(getSafeRedirectPath("/demo/analytics?range=7d")).toBe("/demo/analytics?range=7d");
  });

  test("normalizes missing and external callback paths to the app entry fallback", () => {
    expect(getSafeRedirectPath()).toBe("/app");
    expect(getSafeRedirectPath("https://evil.example")).toBe("/app");
    expect(getSafeRedirectPath("//evil.example")).toBe("/app");
  });

  test("resolves legacy app paths against the owned handle", () => {
    expect(resolveAppRedirectPath("/app", "demo")).toBe("/demo");
    expect(resolveAppRedirectPath("/app/settings", "demo")).toBe("/demo");
    expect(resolveAppRedirectPath("/demo/app/settings?tab=links", "demo")).toBe("/demo?tab=links");
    expect(resolveAppRedirectPath("/demo/analytics?range=7d", "demo")).toBe(
      "/demo/analytics?range=7d"
    );
  });
});
