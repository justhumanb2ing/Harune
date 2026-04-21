import {
  boolean,
  index,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import { plans } from "./plans";
import { users } from "./user";

export const organizationRole = pgEnum("organization_role", ["owner", "admin", "user"]);
export const invitationStatus = pgEnum("invitation_status", [
  "pending",
  "accepted",
  "rejected",
  "canceled",
]);

export const organizations = pgTable(
  "organization",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    image: text("image"),
    metadata: jsonb("metadata").$type<Record<string, unknown> | null>(),
    onboardingDone: boolean("onboardingDone").notNull().default(false),
    onboardingData: jsonb("onboardingData").$type<Record<string, unknown> | null>(),
    stripeCustomerId: text("stripeCustomerId"),
    stripeSubscriptionId: text("stripeSubscriptionId"),
    lemonSqueezyCustomerId: text("lemonSqueezyCustomerId"),
    lemonSqueezySubscriptionId: text("lemonSqueezySubscriptionId"),
    planId: text("planId").references(() => plans.id),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("organization_slug_idx").on(table.slug),
    index("organization_planId_idx").on(table.planId),
  ]
);

export const members = pgTable(
  "member",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    organizationId: text("organizationId")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: organizationRole("role").notNull().default("user"),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("member_organization_user_idx").on(table.organizationId, table.userId),
    index("member_organization_idx").on(table.organizationId),
    index("member_user_idx").on(table.userId),
  ]
);

export const invitations = pgTable(
  "invitation",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    organizationId: text("organizationId")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    role: organizationRole("role").notNull().default("user"),
    status: invitationStatus("status").notNull().default("pending"),
    inviterId: text("inviterId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expiresAt", { mode: "date" }).notNull(),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("invitation_organization_idx").on(table.organizationId),
    index("invitation_email_idx").on(table.email),
    index("invitation_status_idx").on(table.status),
    uniqueIndex("invitation_org_email_status_idx").on(
      table.organizationId,
      table.email,
      table.status
    ),
  ]
);

export type Organization = typeof organizations.$inferSelect;
export type OrganizationMember = typeof members.$inferSelect;
export type OrganizationInvitation = typeof invitations.$inferSelect;
