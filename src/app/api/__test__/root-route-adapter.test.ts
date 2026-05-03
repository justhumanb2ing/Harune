import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { toServerApiRequest } from "@/server/adapter";

describe("root route adapters", () => {
  test("normalizes root API trailing slashes for Hono route matching", () => {
    const request = new Request("http://localhost/api/crawl/?url=https%3A%2F%2Fexample.com");

    const honoRequest = toServerApiRequest(request);

    expect(honoRequest.url).toBe("http://localhost/api/crawl?url=https%3A%2F%2Fexample.com");
    expect(honoRequest.method).toBe("GET");
  });

  test("keeps app-owned API routes behind a thin catch-all adapter to the server Hono API", () => {
    const source = readFileSync(join(process.cwd(), "src/app/api/[[...path]]/route.ts"), "utf8");

    expect(source.includes("handleServerApiRequest")).toBe(true);
    expect(source.includes('dynamic = "force-dynamic"')).toBe(true);
    expect(source.includes("export const DELETE")).toBe(true);
    expect(source.includes("export const GET")).toBe(true);
    expect(source.includes("export const PATCH")).toBe(true);
    expect(source.includes("export const POST")).toBe(true);
    expect(source.includes("NextResponse")).toBe(false);
    expect(source.includes("withAuthRequired")).toBe(false);
    expect(source.includes("redirect(")).toBe(false);
  });
});
