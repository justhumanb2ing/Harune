import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("profile page handle availability route adapter", () => {
  test("keeps the Next route as a thin adapter to the profile-page Hono app", () => {
    const source = readFileSync(
      join(process.cwd(), "src/app/api/app/profile-page/handle-availability/route.ts"),
      "utf8"
    );

    expect(source.includes("profilePageApi.fetch")).toBe(true);
    expect(source.includes("withAuthRequired")).toBe(false);
    expect(source.includes("NextResponse")).toBe(false);
    expect(source.includes("isHandleAvailableForUser")).toBe(false);
  });

  test("leaves the Better Auth route on its official Next.js handler", () => {
    const source = readFileSync(join(process.cwd(), "src/app/api/auth/[...all]/route.ts"), "utf8");

    expect(source.includes("toNextJsHandler(betterAuthServer)")).toBe(true);
    expect(source.includes("profilePageApi")).toBe(false);
    expect(source.includes("Hono")).toBe(false);
  });

  test("keeps the links POST route as a thin adapter to the profile-page Hono app", () => {
    const source = readFileSync(
      join(process.cwd(), "src/app/api/app/profile-page/links/route.ts"),
      "utf8"
    );

    expect(source.includes("profilePageApi.fetch")).toBe(true);
    expect(source.includes("withAuthRequired")).toBe(false);
    expect(source.includes("NextResponse")).toBe(false);
    expect(source.includes("createLinkItem")).toBe(false);
  });

  test("keeps the links item route as a thin adapter to the profile-page Hono app", () => {
    const source = readFileSync(
      join(process.cwd(), "src/app/api/app/profile-page/links/[linkId]/route.ts"),
      "utf8"
    );

    expect(source.includes("profilePageApi.fetch")).toBe(true);
    expect(source.includes("withAuthRequired")).toBe(false);
    expect(source.includes("NextResponse")).toBe(false);
    expect(source.includes("updateLinkItem")).toBe(false);
    expect(source.includes("deleteLinkItem")).toBe(false);
  });

  test("keeps the links reorder route as a thin adapter to the profile-page Hono app", () => {
    const source = readFileSync(
      join(process.cwd(), "src/app/api/app/profile-page/links/reorder/route.ts"),
      "utf8"
    );

    expect(source.includes("profilePageApi.fetch")).toBe(true);
    expect(source.includes("withAuthRequired")).toBe(false);
    expect(source.includes("NextResponse")).toBe(false);
    expect(source.includes("reorderLinkItems")).toBe(false);
  });
});
