import { sql } from "drizzle-orm";
import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { plans } from "../core/plans";
import { users } from "../core/user";

export const paypalAccessTokens = pgTable("paypal_access_tokens", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  token: text("token").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const paypalContext = pgTable("paypal_context", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  planId: text("plan_id").references(() => plans.id),
  userId: text("user_id").references(() => users.id),
  frequency: text("frequency").notNull(),
  paypalOrderId: text("paypal_order_id"),
  paypalSubscriptionId: text("paypal_subscription_id"),
  status: text("status").notNull().default("pending"),
  purchaseType: text("purchase_type").notNull().default("plan"),
  creditType: text("credit_type"),
  creditAmount: text("credit_amount"),
});

export type PaypalAccessToken = typeof paypalAccessTokens.$inferSelect;
export type NewPaypalAccessToken = typeof paypalAccessTokens.$inferInsert;

export type PaypalContext = typeof paypalContext.$inferSelect;
export type NewPaypalContext = typeof paypalContext.$inferInsert;
