import "server-only";

import { desc, eq } from "drizzle-orm";
import type { MeResponse } from "@/app/api/app/me/types";
import { db } from "@/db";
import { plans } from "@/db/schema/plans";
import { profilePages } from "@/db/schema/profile-page";
import { users } from "@/db/schema/user";
import { getOwnedProfilePageCount, getOwnedProfilePages } from "@/lib/profile-page/queries";

export async function getMeForUser(userId: string): Promise<MeResponse> {
  const user = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      image: users.image,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
      planId: users.planId,
      stripeCustomerId: users.stripeCustomerId,
      stripeSubscriptionId: users.stripeSubscriptionId,
      lemonSqueezyCustomerId: users.lemonSqueezyCustomerId,
      lemonSqueezySubscriptionId: users.lemonSqueezySubscriptionId,
      dodoCustomerId: users.dodoCustomerId,
      dodoSubscriptionId: users.dodoSubscriptionId,
      paddleCustomerId: users.paddleCustomerId,
      paddleSubscriptionId: users.paddleSubscriptionId,
      emailVerified: users.emailVerified,
      emailVerifiedBool: users.emailVerifiedBool,
      credits: users.credits,
    })
    .from(users)
    .where(eq(users.id, userId))
    .then((rows) => rows[0]);

  const [currentPlan, ownedProfilePage, ownedProfilePages, profilePageCount] = await Promise.all([
    user?.planId ? getCurrentPlan(user.planId) : Promise.resolve(null),
    db
      .select({
        id: profilePages.id,
        handle: profilePages.handle,
        name: profilePages.name,
        image: profilePages.image,
      })
      .from(profilePages)
      .where(eq(profilePages.userId, userId))
      .orderBy(desc(profilePages.createdAt))
      .limit(1)
      .then((rows) => rows[0] ?? null),
    getOwnedProfilePages(userId),
    getOwnedProfilePageCount(userId),
  ]);

  return {
    currentPlan,
    profilePage: ownedProfilePage,
    profilePages: ownedProfilePages,
    profilePageCount,
    user,
  };
}

async function getCurrentPlan(planId: string): Promise<MeResponse["currentPlan"]> {
  return db
    .select({
      id: plans.id,
      name: plans.name,
      codename: plans.codename,
      quotas: plans.quotas,
      default: plans.default,
    })
    .from(plans)
    .where(eq(plans.id, planId))
    .then((rows) => rows[0] ?? null);
}
