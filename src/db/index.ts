import { drizzle } from "drizzle-orm/postgres-js";
import { env } from "@/env";

if (!env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required to initialize the database client.");
}

export const db = drizzle(env.DATABASE_URL);
