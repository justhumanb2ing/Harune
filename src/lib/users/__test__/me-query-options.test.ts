import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { queryKeys } from "@/lib/react-query/query-keys";
import { meQueryOptions } from "@/lib/users/queries";
import { ME_GC_TIME_MS, ME_STALE_TIME_MS } from "@/lib/users/query-policy";

describe("me query options", () => {
  test("client me query uses the shared app me key and freshness policy", () => {
    const query = meQueryOptions();

    expect(query.queryKey).toEqual(queryKeys.app.me());
    expect(query.staleTime).toBe(ME_STALE_TIME_MS);
    expect(query.gcTime).toBe(ME_GC_TIME_MS);
  });

  test("server me query options stay server-only and do not import client query code", () => {
    const source = readFileSync(
      join(process.cwd(), "src/lib/users/server-query-options.ts"),
      "utf8"
    );

    expect(source).toContain('import "server-only"');
    expect(source).not.toContain("@/lib/users/queries");
    expect(source).toContain("queryKeys.app.me()");
  });
});
