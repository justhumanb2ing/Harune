import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { getGetMeQueryKey } from "@/lib/api/generated/http/me-api/me-api";
import { meQueryOptions } from "@/lib/users/queries";
import { ME_GC_TIME_MS, ME_STALE_TIME_MS } from "@/lib/users/query-policy";

describe("me query options", () => {
  test("client me query uses the shared app me key and freshness policy", () => {
    const query = meQueryOptions();

    expect(query.queryKey).toEqual(getGetMeQueryKey());
    expect(query.staleTime).toBe(ME_STALE_TIME_MS);
    expect(query.gcTime).toBe(ME_GC_TIME_MS);
  });

  test("server me helper stays server-only and calls the me endpoint directly", () => {
    const source = readFileSync(join(process.cwd(), "src/lib/users/server-me.ts"), "utf8");

    expect(source.includes('import "server-only"')).toBe(true);
    expect(source.includes("fetch(")).toBe(true);
    expect(source.includes("/me")).toBe(true);
    expect(source.includes("NEXT_PUBLIC_API_BASE_URL")).toBe(true);
    expect(source.includes("headers: {")).toBe(true);
    expect(source.includes("cookie: cookieHeader")).toBe(true);
  });
});
