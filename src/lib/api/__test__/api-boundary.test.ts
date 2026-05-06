import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const apiLibFiles = [
  "src/lib/api/hono-factory.ts",
  "src/lib/api/middlewares/session.ts",
  "src/lib/api/routes/auth.ts",
  "src/lib/api/routes/root.ts",
  "src/lib/api/routes/app.ts",
  "src/lib/api/routes/profile.ts",
  "src/lib/api/schemas/root.ts",
  "src/lib/api/schemas/app.ts",
  "src/lib/api/schemas/profile.ts",
  "src/lib/api/services/root.ts",
  "src/lib/api/services/app.ts",
  "src/lib/api/services/profile.ts",
  "src/lib/api/services/root-server.ts",
  "src/lib/api/services/app-server.ts",
  "src/lib/api/services/profile-server.ts",
  "src/lib/api/services/auth-server.ts",
  "src/lib/api/repositories/root.ts",
  "src/lib/api/repositories/app.ts",
  "src/lib/api/repositories/profile.ts",
  "src/lib/api/app/types.ts",
  "src/lib/api/server/adapter.ts",
  "src/lib/api/server/create-server-api.ts",
  "src/lib/api/server/index.ts",
];

const routeFiles = [
  "src/lib/api/routes/auth.ts",
  "src/lib/api/routes/root.ts",
  "src/lib/api/routes/app.ts",
  "src/lib/api/routes/profile.ts",
];

const repositoryFiles = [
  "src/lib/api/repositories/root.ts",
  "src/lib/api/repositories/app.ts",
  "src/lib/api/repositories/profile.ts",
];

describe("Hono API boundaries", () => {
  test("keeps converted API modules independent from Next route handlers", () => {
    for (const filePath of apiLibFiles) {
      const source = readFileSync(join(process.cwd(), filePath), "utf8");

      expect(source.includes("@/app/api")).toBe(false);
      expect(source.includes("src/app/api")).toBe(false);
    }
  });

  test("keeps routes focused on HTTP assembly instead of direct DB access", () => {
    for (const filePath of routeFiles) {
      const source = readFileSync(join(process.cwd(), filePath), "utf8");

      expect(source.includes("@/db")).toBe(false);
      expect(source.includes("drizzle-orm")).toBe(false);
      expect(source.includes("@/db/schema")).toBe(false);
    }
  });

  test("keeps repositories independent from Hono route/runtime context", () => {
    for (const filePath of repositoryFiles) {
      const source = readFileSync(join(process.cwd(), filePath), "utf8");

      expect(source.includes("hono")).toBe(false);
      expect(source.includes("@/lib/api/routes")).toBe(false);
      expect(source.includes("Context<")).toBe(false);
    }
  });
});
