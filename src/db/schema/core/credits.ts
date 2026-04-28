import { integer, jsonb, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { users } from "./user";

import type { CreditType } from "@/lib/credits/credits";

export const transactionTypeEnum = pgEnum("transaction_type", ["credit", "debit", "expired"]);

export const creditTransactions = pgTable(
  "credit_transactions",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),

    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    transactionType: transactionTypeEnum("transaction_type").notNull(),
    creditType: text("credit_type").$type<CreditType>().notNull(),
    amount: integer("amount").notNull(),
    paymentId: text("payment_id"),
    expirationDate: timestamp("expiration_date", { mode: "date" }),
    metadata: jsonb("metadata").$type<{
      reason?: string;
      order_id?: string;
      planId?: string;
      [key: string]: unknown;
    }>(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  () => []
).enableRLS();

export type CreditTransaction = typeof creditTransactions.$inferSelect;
export type NewCreditTransaction = typeof creditTransactions.$inferInsert;
