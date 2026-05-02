import { sql } from "drizzle-orm";
import {
  doublePrecision,
  index,
  integer,
  pgEnum,
  pgPolicy,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import {
  authenticatedWriteRole,
  exposedReadRoles,
  hasProfileBento,
  hasProfilePage,
  isCurrentBetterAuthUser,
  isProfileBentoOwner,
  isProfilePageOwner,
} from "../rls";
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

export const profileBentoTypeEnum = pgEnum("profile_bento_type", [
  "link",
  "text",
  "playlist",
  "section",
  "media",
  "map",
]);

export const profileBentoBreakpointEnum = pgEnum("profile_bento_breakpoint", [
  "desktop",
  "compact",
]);

export const profileMediaTypeEnum = pgEnum("profile_media_type", ["image", "video"]);

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
    pgPolicy("profile_page_public_select", {
      for: "select",
      to: exposedReadRoles,
      using: sql`true`,
    }),
    pgPolicy("profile_page_owner_insert", {
      for: "insert",
      to: authenticatedWriteRole,
      withCheck: isCurrentBetterAuthUser(table.userId),
    }),
    pgPolicy("profile_page_owner_update", {
      for: "update",
      to: authenticatedWriteRole,
      using: isCurrentBetterAuthUser(table.userId),
      withCheck: isCurrentBetterAuthUser(table.userId),
    }),
    pgPolicy("profile_page_owner_delete", {
      for: "delete",
      to: authenticatedWriteRole,
      using: isCurrentBetterAuthUser(table.userId),
    }),
  ]
).enableRLS();

export const profileBentos = pgTable(
  "profile_bento",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    profilePageId: text("profilePageId")
      .notNull()
      .references(() => profilePages.id, { onDelete: "cascade" }),
    type: profileBentoTypeEnum("type").notNull(),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("profile_bento_page_id_idx").on(table.profilePageId),
    pgPolicy("profile_bento_public_select", {
      for: "select",
      to: exposedReadRoles,
      using: hasProfilePage(table.profilePageId),
    }),
    pgPolicy("profile_bento_owner_insert", {
      for: "insert",
      to: authenticatedWriteRole,
      withCheck: isProfilePageOwner(table.profilePageId),
    }),
    pgPolicy("profile_bento_owner_update", {
      for: "update",
      to: authenticatedWriteRole,
      using: isProfilePageOwner(table.profilePageId),
      withCheck: isProfilePageOwner(table.profilePageId),
    }),
    pgPolicy("profile_bento_owner_delete", {
      for: "delete",
      to: authenticatedWriteRole,
      using: isProfilePageOwner(table.profilePageId),
    }),
  ]
).enableRLS();

export const profileBentoLayouts = pgTable(
  "profile_bento_layout",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    bentoId: text("bentoId")
      .notNull()
      .references(() => profileBentos.id, { onDelete: "cascade" }),
    breakpoint: profileBentoBreakpointEnum("breakpoint").notNull(),
    x: integer("x").notNull(),
    y: integer("y").notNull(),
    w: integer("w").notNull(),
    h: integer("h").notNull(),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("profile_bento_layout_bento_breakpoint_idx").on(table.bentoId, table.breakpoint),
    index("profile_bento_layout_bento_id_idx").on(table.bentoId),
    pgPolicy("profile_bento_layout_public_select", {
      for: "select",
      to: exposedReadRoles,
      using: hasProfileBento(table.bentoId),
    }),
    pgPolicy("profile_bento_layout_owner_insert", {
      for: "insert",
      to: authenticatedWriteRole,
      withCheck: isProfileBentoOwner(table.bentoId),
    }),
    pgPolicy("profile_bento_layout_owner_update", {
      for: "update",
      to: authenticatedWriteRole,
      using: isProfileBentoOwner(table.bentoId),
      withCheck: isProfileBentoOwner(table.bentoId),
    }),
    pgPolicy("profile_bento_layout_owner_delete", {
      for: "delete",
      to: authenticatedWriteRole,
      using: isProfileBentoOwner(table.bentoId),
    }),
  ]
).enableRLS();

export const profileLinkBentos = pgTable(
  "profile_link_bento",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    bentoId: text("bentoId")
      .notNull()
      .references(() => profileBentos.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    favicon: text("favicon"),
    thumbnail: text("thumbnail"),
    url: text("url").notNull(),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("profile_link_bento_bento_id_idx").on(table.bentoId),
    pgPolicy("profile_link_bento_public_select", {
      for: "select",
      to: exposedReadRoles,
      using: hasProfileBento(table.bentoId),
    }),
    pgPolicy("profile_link_bento_owner_insert", {
      for: "insert",
      to: authenticatedWriteRole,
      withCheck: isProfileBentoOwner(table.bentoId),
    }),
    pgPolicy("profile_link_bento_owner_update", {
      for: "update",
      to: authenticatedWriteRole,
      using: isProfileBentoOwner(table.bentoId),
      withCheck: isProfileBentoOwner(table.bentoId),
    }),
    pgPolicy("profile_link_bento_owner_delete", {
      for: "delete",
      to: authenticatedWriteRole,
      using: isProfileBentoOwner(table.bentoId),
    }),
  ]
).enableRLS();

export const profileTextBentos = pgTable(
  "profile_text_bento",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    bentoId: text("bentoId")
      .notNull()
      .references(() => profileBentos.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("profile_text_bento_bento_id_idx").on(table.bentoId),
    pgPolicy("profile_text_bento_public_select", {
      for: "select",
      to: exposedReadRoles,
      using: hasProfileBento(table.bentoId),
    }),
    pgPolicy("profile_text_bento_owner_insert", {
      for: "insert",
      to: authenticatedWriteRole,
      withCheck: isProfileBentoOwner(table.bentoId),
    }),
    pgPolicy("profile_text_bento_owner_update", {
      for: "update",
      to: authenticatedWriteRole,
      using: isProfileBentoOwner(table.bentoId),
      withCheck: isProfileBentoOwner(table.bentoId),
    }),
    pgPolicy("profile_text_bento_owner_delete", {
      for: "delete",
      to: authenticatedWriteRole,
      using: isProfileBentoOwner(table.bentoId),
    }),
  ]
).enableRLS();

export const profilePlaylistBentos = pgTable(
  "profile_playlist_bento",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    bentoId: text("bentoId")
      .notNull()
      .references(() => profileBentos.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    provider: text("provider").notNull(),
    url: text("url").notNull(),
    content: text("content").notNull(),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("profile_playlist_bento_bento_id_idx").on(table.bentoId),
    pgPolicy("profile_playlist_bento_public_select", {
      for: "select",
      to: exposedReadRoles,
      using: hasProfileBento(table.bentoId),
    }),
    pgPolicy("profile_playlist_bento_owner_insert", {
      for: "insert",
      to: authenticatedWriteRole,
      withCheck: isProfileBentoOwner(table.bentoId),
    }),
    pgPolicy("profile_playlist_bento_owner_update", {
      for: "update",
      to: authenticatedWriteRole,
      using: isProfileBentoOwner(table.bentoId),
      withCheck: isProfileBentoOwner(table.bentoId),
    }),
    pgPolicy("profile_playlist_bento_owner_delete", {
      for: "delete",
      to: authenticatedWriteRole,
      using: isProfileBentoOwner(table.bentoId),
    }),
  ]
).enableRLS();

export const profileSectionBentos = pgTable(
  "profile_section_bento",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    bentoId: text("bentoId")
      .notNull()
      .references(() => profileBentos.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
  },
  (table) => [
    uniqueIndex("profile_section_bento_bento_id_idx").on(table.bentoId),
    pgPolicy("profile_section_bento_public_select", {
      for: "select",
      to: exposedReadRoles,
      using: hasProfileBento(table.bentoId),
    }),
    pgPolicy("profile_section_bento_owner_insert", {
      for: "insert",
      to: authenticatedWriteRole,
      withCheck: isProfileBentoOwner(table.bentoId),
    }),
    pgPolicy("profile_section_bento_owner_update", {
      for: "update",
      to: authenticatedWriteRole,
      using: isProfileBentoOwner(table.bentoId),
      withCheck: isProfileBentoOwner(table.bentoId),
    }),
    pgPolicy("profile_section_bento_owner_delete", {
      for: "delete",
      to: authenticatedWriteRole,
      using: isProfileBentoOwner(table.bentoId),
    }),
  ]
).enableRLS();

export const profileMediaBentos = pgTable(
  "profile_media_bento",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    bentoId: text("bentoId")
      .notNull()
      .references(() => profileBentos.id, { onDelete: "cascade" }),
    mediaType: profileMediaTypeEnum("mediaType").notNull(),
    url: text("url").notNull(),
    objectKey: text("objectKey").notNull(),
    href: text("href"),
    alt: text("alt").notNull(),
    caption: text("caption").notNull().default(""),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("profile_media_bento_bento_id_idx").on(table.bentoId),
    pgPolicy("profile_media_bento_public_select", {
      for: "select",
      to: exposedReadRoles,
      using: hasProfileBento(table.bentoId),
    }),
    pgPolicy("profile_media_bento_owner_insert", {
      for: "insert",
      to: authenticatedWriteRole,
      withCheck: isProfileBentoOwner(table.bentoId),
    }),
    pgPolicy("profile_media_bento_owner_update", {
      for: "update",
      to: authenticatedWriteRole,
      using: isProfileBentoOwner(table.bentoId),
      withCheck: isProfileBentoOwner(table.bentoId),
    }),
    pgPolicy("profile_media_bento_owner_delete", {
      for: "delete",
      to: authenticatedWriteRole,
      using: isProfileBentoOwner(table.bentoId),
    }),
  ]
).enableRLS();

export const profileMapBentos = pgTable(
  "profile_map_bento",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    bentoId: text("bentoId")
      .notNull()
      .references(() => profileBentos.id, { onDelete: "cascade" }),
    latitude: doublePrecision("latitude").notNull(),
    longitude: doublePrecision("longitude").notNull(),
    zoom: integer("zoom").notNull(),
    caption: text("caption").notNull().default(""),
    url: text("url").notNull(),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("profile_map_bento_bento_id_idx").on(table.bentoId),
    pgPolicy("profile_map_bento_public_select", {
      for: "select",
      to: exposedReadRoles,
      using: hasProfileBento(table.bentoId),
    }),
    pgPolicy("profile_map_bento_owner_insert", {
      for: "insert",
      to: authenticatedWriteRole,
      withCheck: isProfileBentoOwner(table.bentoId),
    }),
    pgPolicy("profile_map_bento_owner_update", {
      for: "update",
      to: authenticatedWriteRole,
      using: isProfileBentoOwner(table.bentoId),
      withCheck: isProfileBentoOwner(table.bentoId),
    }),
    pgPolicy("profile_map_bento_owner_delete", {
      for: "delete",
      to: authenticatedWriteRole,
      using: isProfileBentoOwner(table.bentoId),
    }),
  ]
).enableRLS();

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
    pgPolicy("profile_social_link_public_select", {
      for: "select",
      to: exposedReadRoles,
      using: hasProfilePage(table.profilePageId),
    }),
    pgPolicy("profile_social_link_owner_insert", {
      for: "insert",
      to: authenticatedWriteRole,
      withCheck: isProfilePageOwner(table.profilePageId),
    }),
    pgPolicy("profile_social_link_owner_update", {
      for: "update",
      to: authenticatedWriteRole,
      using: isProfilePageOwner(table.profilePageId),
      withCheck: isProfilePageOwner(table.profilePageId),
    }),
    pgPolicy("profile_social_link_owner_delete", {
      for: "delete",
      to: authenticatedWriteRole,
      using: isProfilePageOwner(table.profilePageId),
    }),
  ]
).enableRLS();

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
    pgPolicy("profile_link_item_public_select", {
      for: "select",
      to: exposedReadRoles,
      using: hasProfilePage(table.profilePageId),
    }),
    pgPolicy("profile_link_item_owner_insert", {
      for: "insert",
      to: authenticatedWriteRole,
      withCheck: isProfilePageOwner(table.profilePageId),
    }),
    pgPolicy("profile_link_item_owner_update", {
      for: "update",
      to: authenticatedWriteRole,
      using: isProfilePageOwner(table.profilePageId),
      withCheck: isProfilePageOwner(table.profilePageId),
    }),
    pgPolicy("profile_link_item_owner_delete", {
      for: "delete",
      to: authenticatedWriteRole,
      using: isProfilePageOwner(table.profilePageId),
    }),
  ]
).enableRLS();

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
    pgPolicy("profile_text_box_item_public_select", {
      for: "select",
      to: exposedReadRoles,
      using: hasProfilePage(table.profilePageId),
    }),
    pgPolicy("profile_text_box_item_owner_insert", {
      for: "insert",
      to: authenticatedWriteRole,
      withCheck: isProfilePageOwner(table.profilePageId),
    }),
    pgPolicy("profile_text_box_item_owner_update", {
      for: "update",
      to: authenticatedWriteRole,
      using: isProfilePageOwner(table.profilePageId),
      withCheck: isProfilePageOwner(table.profilePageId),
    }),
    pgPolicy("profile_text_box_item_owner_delete", {
      for: "delete",
      to: authenticatedWriteRole,
      using: isProfilePageOwner(table.profilePageId),
    }),
  ]
).enableRLS();

export const profilePlaylistItems = pgTable(
  "profile_playlist_item",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    profilePageId: text("profilePageId")
      .notNull()
      .references(() => profilePages.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    provider: text("provider").notNull(),
    content: text("content").notNull(),
    position: integer("position").notNull(),
    blockPosition: integer("blockPosition").notNull(),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("profile_playlist_item_page_position_idx").on(table.profilePageId, table.position),
    index("profile_playlist_item_page_id_idx").on(table.profilePageId),
    pgPolicy("profile_playlist_item_public_select", {
      for: "select",
      to: exposedReadRoles,
      using: hasProfilePage(table.profilePageId),
    }),
    pgPolicy("profile_playlist_item_owner_insert", {
      for: "insert",
      to: authenticatedWriteRole,
      withCheck: isProfilePageOwner(table.profilePageId),
    }),
    pgPolicy("profile_playlist_item_owner_update", {
      for: "update",
      to: authenticatedWriteRole,
      using: isProfilePageOwner(table.profilePageId),
      withCheck: isProfilePageOwner(table.profilePageId),
    }),
    pgPolicy("profile_playlist_item_owner_delete", {
      for: "delete",
      to: authenticatedWriteRole,
      using: isProfilePageOwner(table.profilePageId),
    }),
  ]
).enableRLS();
