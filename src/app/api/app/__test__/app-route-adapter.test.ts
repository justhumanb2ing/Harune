import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { toAppApiRequest } from "@/lib/api/app/adapter";

describe("app route adapters", () => {
  test("rewrites Next app API URLs to Hono app-local paths", () => {
    const request = new Request("http://localhost/api/app/me/?draft=1", {
      method: "GET",
    });

    const honoRequest = toAppApiRequest(request);

    expect(honoRequest.url).toBe("http://localhost/me?draft=1");
    expect(honoRequest.method).toBe("GET");
  });

  test("keeps the me route as a thin adapter to the app Hono API", () => {
    const source = readFileSync(join(process.cwd(), "src/app/api/app/me/route.ts"), "utf8");

    expect(source.includes("handleAppApiRequest")).toBe(true);
    expect(source.includes("withAuthRequired")).toBe(false);
    expect(source.includes("NextResponse")).toBe(false);
    expect(source.includes("getMeForUser")).toBe(false);
    expect(source.includes("profileUpdateSchema")).toBe(false);
  });

  test("keeps the analytics route as a thin adapter to the app Hono API", () => {
    const source = readFileSync(join(process.cwd(), "src/app/api/app/analytics/route.ts"), "utf8");

    expect(source.includes("handleAppApiRequest")).toBe(true);
    expect(source.includes("withAuthRequired")).toBe(false);
    expect(source.includes("NextResponse")).toBe(false);
    expect(source.includes("getProfileAnalyticsResponse")).toBe(false);
  });
});
