import { boolean, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { users } from "../core/user";

export const coupons = pgTable(
  "coupon",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    code: text("code").unique().notNull(),
    userId: text("userId").references(() => users.id),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow(),
    usedAt: timestamp("usedAt", { mode: "date" }),
    expired: boolean("expired").default(false),
  },
  () => []
).enableRLS();
