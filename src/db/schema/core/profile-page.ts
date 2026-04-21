import { index, jsonb, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

import { users } from "./user";

type ProfileSocialLinks = {
  x?: string;
  instagram?: string;
  youtube?: string;
  linkedin?: string;
  github?: string;
};

export const profilePages = pgTable(
  "profile_page",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    handle: text("handle").notNull(),
    name: text("name"),
    bio: text("bio"),
    image: text("image"),
    socialLinks: jsonb("socialLinks").$type<ProfileSocialLinks>().notNull().default({}),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("profile_page_handle_idx").on(table.handle),
    index("profile_page_user_id_idx").on(table.userId),
  ]
);
