import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { getGetMeQueryKey } from "@/lib/api/generated/http/me-api/me-api";

describe("me generated client wiring", () => {
  test("client me query uses the generated hook and shared app me key", () => {
    const source = readFileSync(join(process.cwd(), "src/lib/users/use-user.ts"), "utf8");

    expect(source.includes("useGetMe")).toBe(true);
    expect(source.includes("meQueryOptions")).toBe(false);
    expect(getGetMeQueryKey()[0].includes("/me")).toBe(true);
  });

  test("app entry CTA uses generated prefetch and fetch helpers", () => {
    const source = readFileSync(
      join(process.cwd(), "src/components/website/app-entry-cta-button.tsx"),
      "utf8"
    );

    expect(source.includes("prefetchGetMeQuery")).toBe(true);
    expect(source.includes("getGetMeQueryOptions")).toBe(true);
    expect(source.includes("meQueryOptions")).toBe(false);
  });

  test("server me helper stays server-only and calls the me endpoint directly", () => {
    const source = readFileSync(join(process.cwd(), "src/lib/users/server-me.ts"), "utf8");

    expect(source.includes('import "server-only"')).toBe(true);
    expect(source.includes("fetch(")).toBe(true);
    expect(source.includes("/me")).toBe(true);
    expect(source.includes("getAppApiBaseURL")).toBe(true);
    expect(source.includes("NEXT_PUBLIC_API_BASE_URL")).toBe(false);
    expect(source.includes("headers: {")).toBe(true);
    expect(source.includes("cookie: cookieHeader")).toBe(true);
  });
});
