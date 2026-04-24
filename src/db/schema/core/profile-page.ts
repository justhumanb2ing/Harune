import { index, integer, pgEnum, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

import { users } from "./user";

export const profileSocialPlatformEnum = pgEnum("profile_social_platform", [
  "x",
  "instagram",
  "youtube",
  "linkedin",
  "github",
  "threads",
  "soundcloud",
  "spotify",
  "behance",
  "tiktok",
  "mail",
  "apple_music",
]);

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
    location: text("location"),
    role: text("role"),
    bio: text("bio"),
    image: text("image"),
    backgroundImage: text("backgroundImage"),
    linkBlockPosition: integer("linkBlockPosition").default(0).notNull(),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("profile_page_handle_idx").on(table.handle),
    index("profile_page_user_id_idx").on(table.userId),
  ]
);

export const profileSocialLinks = pgTable(
  "profile_social_link",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    profilePageId: text("profilePageId")
      .notNull()
      .references(() => profilePages.id, { onDelete: "cascade" }),
    platform: profileSocialPlatformEnum("platform").notNull(),
    url: text("url").notNull(),
    position: integer("position").notNull(),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("profile_social_link_page_platform_idx").on(table.profilePageId, table.platform),
    uniqueIndex("profile_social_link_page_position_idx").on(table.profilePageId, table.position),
    index("profile_social_link_page_id_idx").on(table.profilePageId),
  ]
);

export const profileLinkItems = pgTable(
  "profile_link_item",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    profilePageId: text("profilePageId")
      .notNull()
      .references(() => profilePages.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    favicon: text("favicon"),
    url: text("url").notNull(),
    position: integer("position").notNull(),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("profile_link_item_page_position_idx").on(table.profilePageId, table.position),
    index("profile_link_item_page_id_idx").on(table.profilePageId),
  ]
);

export const profileTextBoxItems = pgTable(
  "profile_text_box_item",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    profilePageId: text("profilePageId")
      .notNull()
      .references(() => profilePages.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    position: integer("position").notNull(),
    blockPosition: integer("blockPosition").notNull(),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("profile_text_box_item_page_position_idx").on(table.profilePageId, table.position),
    index("profile_text_box_item_page_id_idx").on(table.profilePageId),
  ]
);
