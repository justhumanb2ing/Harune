import { describe, expect, test } from "bun:test";

import type { GetMe200 } from "@/lib/api/generated/http/schemas/me-api";
import { createSignInCallbackHref, resolveAppEntryHref } from "@/lib/auth/app-entry";

const me: GetMe200 = {
  profilePage: {
    handle: "demo",
    id: "page-1",
    image: null,
    name: "Demo",
  },
  user: {
    email: "demo@example.com",
    id: "user-1",
    image: null,
    name: "Demo",
    createdAt: "2026-05-07T00:00:00.000Z",
    updatedAt: "2026-05-07T00:00:00.000Z",
  },
};

describe("app entry resolver", () => {
  test("redirects anonymous users to sign-in with a safe callback", () => {
    expect(createSignInCallbackHref("/app?next=/create")).toBe("/sign-in?callbackUrl=%2F");
  });

  test("routes logged-in users without a profile page to create", () => {
    expect(resolveAppEntryHref({ next: "/app", profilePage: null })).toBe("/create");
  });

  test("maps app destinations to the owned handle", () => {
    expect(resolveAppEntryHref({ next: "/app?from=landing", profilePage: me.profilePage })).toBe(
      "/demo"
    );
  });

  test("keeps analytics destinations intact", () => {
    expect(
      resolveAppEntryHref({ next: "/demo/analytics?range=7d", profilePage: me.profilePage })
    ).toBe("/demo/analytics?range=7d");
  });
});
