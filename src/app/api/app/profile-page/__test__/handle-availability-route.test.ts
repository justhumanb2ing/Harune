import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("profile page handle availability route adapter", () => {
  test("keeps the Next route as a thin adapter to the profile-page Hono app", () => {
    const source = readFileSync(
      join(process.cwd(), "src/app/api/app/profile-page/handle-availability/route.ts"),
      "utf8"
    );

    expect(source).toContain("profilePageApi.fetch");
    expect(source).not.toContain("withAuthRequired");
    expect(source).not.toContain("NextResponse");
    expect(source).not.toContain("isHandleAvailableForUser");
  });
});
