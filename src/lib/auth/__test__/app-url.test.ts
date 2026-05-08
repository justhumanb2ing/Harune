import { describe, expect, test } from "bun:test";

import { resolveAbsoluteAppUrl } from "@/lib/auth/app-url";

describe("app url helpers", () => {
  test("resolves relative paths against the app origin", () => {
    expect(resolveAbsoluteAppUrl("/create", "https://harune.me")).toBe("https://harune.me/create");
  });

  test("keeps query strings when resolving relative paths", () => {
    expect(resolveAbsoluteAppUrl("/sign-in?callbackUrl=%2Fcreate", "http://localhost:3000")).toBe(
      "http://localhost:3000/sign-in?callbackUrl=%2Fcreate"
    );
  });
});
