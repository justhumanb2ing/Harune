import { config as loadEnv } from "dotenv";
import { defineConfig } from "drizzle-kit";

loadEnv({ path: ".env" });
loadEnv({ path: ".env.local", override: true });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
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
    url: databaseUrl,
  },
});
