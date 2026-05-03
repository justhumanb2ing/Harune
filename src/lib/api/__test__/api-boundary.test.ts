import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const apiLibFiles = [
  "src/lib/api/hono-factory.ts",
  "src/lib/api/root/app.ts",
  "src/lib/api/root/server-app.ts",
  "src/lib/api/app/app.ts",
  "src/lib/api/app/server-app.ts",
  "src/lib/api/app/types.ts",
  "src/lib/api/profile/app.ts",
  "src/lib/api/profile/server-app.ts",
  "src/server/adapter.ts",
  "src/server/create-server-api.ts",
  "src/server/index.ts",
];

describe("Hono API boundaries", () => {
  test("keeps converted API modules independent from Next route handlers", () => {
    for (const filePath of apiLibFiles) {
      const source = readFileSync(join(process.cwd(), filePath), "utf8");

      expect(source.includes("@/app/api")).toBe(false);
      expect(source.includes("src/app/api")).toBe(false);
    }
  });
});
