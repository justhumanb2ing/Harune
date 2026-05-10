import { describe, expect, test } from "bun:test";

import { buildAuthSessionCookieHeader } from "@/lib/auth/request-cookies";

describe("buildAuthSessionCookieHeader", () => {
  test("returns null when no auth session cookie exists", () => {
    const header = buildAuthSessionCookieHeader({
      getAll: () => [
        { name: "theme", value: "dark" },
        { name: "next.locale", value: "en" },
      ],
    });

    expect(header).toBeNull();
  });

  test("keeps only the Better Auth session cookie and its chunks", () => {
    const header = buildAuthSessionCookieHeader({
      getAll: () => [
        { name: "theme", value: "dark" },
        { name: "better-auth.session_token", value: "token-a" },
        { name: "better-auth.session_token.1", value: "token-b" },
        { name: "__Secure-better-auth.session_token", value: "secure-token" },
      ],
    });

    expect(header).toContain("better-auth.session_token=token-a");
    expect(header).toContain("better-auth.session_token.1=token-b");
    expect(header).toContain("__Secure-better-auth.session_token=secure-token");
    expect(header).not.toContain("theme=dark");
  });
});
