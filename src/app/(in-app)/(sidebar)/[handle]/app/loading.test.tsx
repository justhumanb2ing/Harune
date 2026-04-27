import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const readSource = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("in-app route loading fallbacks", () => {
  test("app loading keeps editor and preview shell dimensions stable", () => {
    const source = readSource("src/app/(in-app)/(sidebar)/[handle]/app/loading.tsx");

    expect(source).toContain("relative flex h-full min-h-0 flex-row gap-4");
    expect(source).toContain("aspect-square");
    expect(source).toContain("lg:hidden");
  });

  test("analytics loading leaves room for mobile bottom action", () => {
    const source = readSource("src/app/(in-app)/(sidebar)/[handle]/analytics/loading.tsx");

    expect(source).toContain("pb-24");
    expect(source).toContain("fixed inset-x-0 bottom-0");
    expect(source).toContain("min-h-80");
  });

  test("analytics page does not block route entry on analytics summary fetch", () => {
    const source = readSource("src/app/(in-app)/(sidebar)/[handle]/analytics/page.tsx");

    expect(source).toContain("getOwnedProfilePage");
    expect(source).not.toContain("profileAnalyticsServerQueryOptions");
    expect(source).not.toContain("prefetchQuery");
    expect(source).not.toContain("HydrationBoundary");
  });
});
