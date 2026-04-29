import { describe, expect, test } from "bun:test";

import { getProxyRouteDecision } from "@/lib/auth/proxy-auth-boundary";
import { createUnauthorizedResponse } from "@/lib/auth/responses";
import { config } from "@/proxy";

const decide = (path: string, hasSessionSignal = false) =>
  getProxyRouteDecision({
    hasSessionSignal,
    requestUrl: new URL(path, "https://leeve.test"),
  });

describe("proxy auth boundary", () => {
  test("redirects legacy app entry to join", () => {
    const decision = decide("/app?from=legacy");

    expect(decision.kind).toBe("redirect");
    if (decision.kind === "redirect") {
      expect(decision.url.pathname).toBe("/api/join");
      expect(decision.url.search).toBe("?from=legacy");
    }
  });

  test("redirects authenticated auth-page access to join with callback", () => {
    const decision = decide("/sign-in?callbackUrl=/create", true);

    expect(decision.kind).toBe("redirect");
    if (decision.kind === "redirect") {
      expect(decision.url.pathname).toBe("/api/join");
      expect(decision.url.searchParams.get("next")).toBe("/create");
    }
  });

  test("collapses nested join callbacks before resolving authenticated redirects", () => {
    const decision = decide(
      "/sign-in?callbackUrl=/api/join?next=%2Fapi%2Fjoin%3Fnext%3D%2Fcreate",
      true
    );

    expect(decision.kind).toBe("redirect");
    if (decision.kind === "redirect") {
      expect(decision.url.pathname).toBe("/api/join");
      expect(decision.url.searchParams.get("next")).toBe("/create");
    }
  });

  test("lets join normalize external callback attempts", () => {
    const decision = decide("/sign-in?callbackUrl=//evil.example", true);

    expect(decision.kind).toBe("redirect");
    if (decision.kind === "redirect") {
      expect(decision.url.pathname).toBe("/api/join");
      expect(decision.url.searchParams.get("next")).toBe("/app");
    }
  });

  test("redirects missing session on protected app pages to sign-in callback", () => {
    const decision = decide("/demo/app/links?mode=edit");

    expect(decision.kind).toBe("redirect");
    if (decision.kind === "redirect") {
      expect(decision.url.pathname).toBe("/sign-in");
      expect(decision.url.searchParams.get("callbackUrl")).toBe("/demo/app/links?mode=edit");
    }
  });

  test("keeps app api unauthorized JSON contract at the auth boundary", async () => {
    const response = createUnauthorizedResponse();

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: "Unauthorized",
      message: "You are not authorized to perform this action",
    });
  });

  test("leaves app api requests to route handlers for auth JSON", () => {
    expect(decide("/api/app/me")).toEqual({ kind: "next" });
    expect(config.matcher).not.toContain("/api/app/:path*");
  });

  test("allows session-cookie signal through to protected pages for page-level validation", () => {
    expect(decide("/demo/analytics", true)).toEqual({ kind: "next" });
  });
});
