import { describe, expect, test } from "bun:test";

import type { MeResponse } from "@/lib/api/app/types";
import { createSignInCallbackHref, resolveAppEntryHref } from "@/lib/auth/app-entry";

const me = {
  currentPlan: null,
  profilePage: {
    handle: "demo",
    id: "page-1",
    image: null,
    name: "Demo",
  },
  user: {
    credits: {},
    createdAt: "2026-05-07T00:00:00.000Z",
    dodoCustomerId: null,
    dodoSubscriptionId: null,
    email: "demo@example.com",
    emailVerified: false,
    emailVerifiedBool: false,
    id: "user-1",
    image: null,
    lemonSqueezyCustomerId: null,
    lemonSqueezySubscriptionId: null,
    name: "Demo",
    paddleCustomerId: null,
    paddleSubscriptionId: null,
    planId: null,
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    updatedAt: "2026-05-07T00:00:00.000Z",
  },
} as unknown as MeResponse;

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
