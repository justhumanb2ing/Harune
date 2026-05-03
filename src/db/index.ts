import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/env";

if (!env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required to initialize the database client.");
}

export const dbClient = postgres(env.DATABASE_URL, {
  prepare: false,
});

export const db = drizzle(dbClient);
