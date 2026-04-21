import { db } from "@/db";
import { invitations, members, organizations } from "@/db/schema/organization";
import { plans } from "@/db/schema/plans";
import { users } from "@/db/schema/user";
import { and, asc, eq } from "drizzle-orm";
import type {
  OrganizationMemberSummary,
  OrganizationRole,
  UserOrganizationWithPlan,
} from "./types";

type OrganizationRow = {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  onboardingDone: boolean;
  role: string;
  planId: string | null;
  planName: string | null;
  planCodename: string | null;
  planDefault: boolean | null;
  planQuotas: typeof plans.$inferSelect.quotas | null;
  planRequiredCouponCount: number | null;
};

const toOrganizationRole = (role: string): OrganizationRole => {
  if (role === "owner" || role === "admin" || role === "user") {
    return role;
  }
  return "user";
};

const mapOrganizationRow = (row: OrganizationRow): UserOrganizationWithPlan => {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    image: row.image,
    onboardingDone: row.onboardingDone,
    role: toOrganizationRole(row.role),
    plan:
      row.planId && row.planName
        ? {
            id: row.planId,
            name: row.planName,
            codename: row.planCodename,
            default: row.planDefault ?? false,
            quotas: row.planQuotas,
            requiredCouponCount: row.planRequiredCouponCount ?? 0,
          }
        : null,
  };
};

export const getUserOrganizations = async (userId: string): Promise<UserOrganizationWithPlan[]> => {
  const rows = await db
    .select({
      id: organizations.id,
      name: organizations.name,
      slug: organizations.slug,
      image: organizations.image,
      onboardingDone: organizations.onboardingDone,
      role: members.role,
      planId: plans.id,
      planName: plans.name,
      planCodename: plans.codename,
      planDefault: plans.default,
      planQuotas: plans.quotas,
      planRequiredCouponCount: plans.requiredCouponCount,
    })
    .from(members)
    .innerJoin(organizations, eq(members.organizationId, organizations.id))
    .leftJoin(plans, eq(organizations.planId, plans.id))
    .where(eq(members.userId, userId))
    .orderBy(asc(organizations.createdAt));

  return rows.map((row) => mapOrganizationRow(row as OrganizationRow));
};

export const getUserOrganizationById = async ({
  userId,
  organizationId,
}: {
  userId: string;
  organizationId: string;
}): Promise<UserOrganizationWithPlan | null> => {
  const row = await db
    .select({
      id: organizations.id,
      name: organizations.name,
      slug: organizations.slug,
      image: organizations.image,
      onboardingDone: organizations.onboardingDone,
      role: members.role,
      planId: plans.id,
      planName: plans.name,
      planCodename: plans.codename,
      planDefault: plans.default,
      planQuotas: plans.quotas,
      planRequiredCouponCount: plans.requiredCouponCount,
    })
    .from(members)
    .innerJoin(organizations, eq(members.organizationId, organizations.id))
    .leftJoin(plans, eq(organizations.planId, plans.id))
    .where(and(eq(members.userId, userId), eq(members.organizationId, organizationId)))
    .limit(1)
    .then((items) => items[0]);

  if (!row) {
    return null;
  }

  return mapOrganizationRow(row as OrganizationRow);
};

export const getUserOrganizationBySlug = async ({
  userId,
  slug,
}: {
  userId: string;
  slug: string;
}): Promise<UserOrganizationWithPlan | null> => {
  const row = await db
    .select({
      id: organizations.id,
      name: organizations.name,
      slug: organizations.slug,
      image: organizations.image,
      onboardingDone: organizations.onboardingDone,
      role: members.role,
      planId: plans.id,
      planName: plans.name,
      planCodename: plans.codename,
      planDefault: plans.default,
      planQuotas: plans.quotas,
      planRequiredCouponCount: plans.requiredCouponCount,
    })
    .from(members)
    .innerJoin(organizations, eq(members.organizationId, organizations.id))
    .leftJoin(plans, eq(organizations.planId, plans.id))
    .where(and(eq(members.userId, userId), eq(organizations.slug, slug)))
    .limit(1)
    .then((items) => items[0]);

  if (!row) {
    return null;
  }

  return mapOrganizationRow(row as OrganizationRow);
};

export const userBelongsToOrganization = async ({
  userId,
  organizationId,
}: {
  userId: string;
  organizationId: string;
}) => {
  const membership = await db
    .select({ id: members.id })
    .from(members)
    .where(and(eq(members.userId, userId), eq(members.organizationId, organizationId)))
    .limit(1)
    .then((items) => items[0]);

  return !!membership;
};

const slugify = (value: string) => {
  const base = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return base || `org-${crypto.randomUUID().slice(0, 8)}`;
};

const getUniqueSlug = async (input: string) => {
  const base = slugify(input);

  for (let i = 0; i < 20; i += 1) {
    const candidate = i === 0 ? base : `${base}-${i + 1}`;
    const exists = await db
      .select({ id: organizations.id })
      .from(organizations)
      .where(eq(organizations.slug, candidate))
      .limit(1)
      .then((rows) => rows[0]);

    if (!exists) {
      return candidate;
    }
  }

  return `${base}-${crypto.randomUUID().slice(0, 8)}`;
};

export const createOrganization = async ({
  name,
  creatorId,
}: {
  name: string;
  creatorId: string;
}) => {
  const slug = await getUniqueSlug(name);

  return db.transaction(async (tx) => {
    const organization = await tx
      .insert(organizations)
      .values({
        name,
        slug,
        onboardingDone: false,
        updatedAt: new Date(),
      })
      .returning({
        id: organizations.id,
        name: organizations.name,
        slug: organizations.slug,
        image: organizations.image,
        onboardingDone: organizations.onboardingDone,
      })
      .then((items) => items[0]);

    await tx.insert(members).values({
      organizationId: organization.id,
      userId: creatorId,
      role: "owner",
    });

    return organization;
  });
};

export const getOrganizationMembers = async ({
  organizationId,
}: {
  organizationId: string;
}): Promise<OrganizationMemberSummary[]> => {
  const rows = await db
    .select({
      id: members.id,
      organizationId: members.organizationId,
      userId: members.userId,
      role: members.role,
      createdAt: members.createdAt,
      userIdRef: users.id,
      userName: users.name,
      userEmail: users.email,
      userImage: users.image,
    })
    .from(members)
    .innerJoin(users, eq(members.userId, users.id))
    .where(eq(members.organizationId, organizationId))
    .orderBy(asc(members.createdAt));

  return rows.map((row) => ({
    id: row.id,
    organizationId: row.organizationId,
    userId: row.userId,
    role: toOrganizationRole(row.role),
    createdAt: row.createdAt,
    user: {
      id: row.userIdRef,
      name: row.userName,
      email: row.userEmail,
      image: row.userImage,
    },
  }));
};

export const getOrganizationPendingInvitations = async ({
  organizationId,
}: {
  organizationId: string;
}) => {
  return db
    .select({
      id: invitations.id,
      email: invitations.email,
      role: invitations.role,
      status: invitations.status,
      expiresAt: invitations.expiresAt,
      createdAt: invitations.createdAt,
      inviterId: invitations.inviterId,
      organizationId: invitations.organizationId,
    })
    .from(invitations)
    .where(and(eq(invitations.organizationId, organizationId), eq(invitations.status, "pending")))
    .orderBy(asc(invitations.createdAt));
};
