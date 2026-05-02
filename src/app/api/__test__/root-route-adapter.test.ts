import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { toRootApiRequest } from "@/lib/api/root/adapter";

describe("root route adapters", () => {
  test("normalizes root API trailing slashes for Hono route matching", () => {
    const request = new Request("http://localhost/api/test/?url=https%3A%2F%2Fexample.com");

    const honoRequest = toRootApiRequest(request);

    expect(honoRequest.url).toBe("http://localhost/api/test?url=https%3A%2F%2Fexample.com");
    expect(honoRequest.method).toBe("GET");
  });

  test("keeps root API routes as thin adapters to the root Hono API", () => {
    const routePaths = [
      "src/app/api/handles/availability/route.ts",
      "src/app/api/test/route.ts",
      "src/app/api/join/route.ts",
    ];

    for (const routePath of routePaths) {
      const source = readFileSync(join(process.cwd(), routePath), "utf8");

      expect(source.includes("handleRootApiRequest")).toBe(true);
      expect(source.includes("NextResponse")).toBe(false);
      expect(source.includes("withAuthRequired")).toBe(false);
      expect(source.includes("redirect(")).toBe(false);
    }
  });
});
