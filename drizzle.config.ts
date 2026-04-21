import "dotenv/config";
import { defineConfig } from "drizzle-kit";
import { env } from "./src/env";

if (!env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required to run Drizzle commands.");
}

const modules = new Set(
  (process.env.DB_MODULES ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
);

const schema = [
  "./src/db/schema/core/user.ts",
  "./src/db/schema/core/profile-page.ts",
  "./src/db/schema/core/plans.ts",
  "./src/db/schema/core/credits.ts",
  ...(modules.has("coupons") ? ["./src/db/schema/extensions/coupons.ts"] : []),
  ...(modules.has("contact") ? ["./src/db/schema/extensions/contact.ts"] : []),
  ...(modules.has("organization") ? ["./src/db/schema/extensions/organization.ts"] : []),
  ...(modules.has("paypal") ? ["./src/db/schema/extensions/paypal.ts"] : []),
  ...(modules.has("waitlist") ? ["./src/db/schema/extensions/waitlist.ts"] : []),
];

export default defineConfig({
  out: "./drizzle",
  schema,
  dialect: "postgresql",
  extensionsFilters: [
    // "postgis", // Uncomment if you need postgis
  ],
  dbCredentials: {
    url: env.DATABASE_URL,
  },
});
