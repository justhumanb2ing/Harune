import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { toServerApiRequest } from "@/lib/api/server/adapter";

describe("/metadata route adapter", () => {
  test("normalizes trailing slashes for the public metadata route", () => {
    const request = new Request("http://localhost/metadata/?url=https%3A%2F%2Fexample.com");

    const honoRequest = toServerApiRequest(request);

    expect(honoRequest.url).toBe("http://localhost/metadata?url=https%3A%2F%2Fexample.com");
    expect(honoRequest.method).toBe("GET");
  });

  test("exposes the metadata route as a thin GET handler for the shared Hono server", () => {
    const source = readFileSync(join(process.cwd(), "src/app/metadata/route.ts"), "utf8");

    expect(source.includes('from "hono/vercel"')).toBe(true);
    expect(source.includes("handle(routes)")).toBe(true);
    expect(source.includes('dynamic = "force-dynamic"')).toBe(true);
    expect(source.includes("export const GET")).toBe(true);
    expect(source.includes("export const POST")).toBe(false);
    expect(source.includes("NextResponse")).toBe(false);
  });
});
