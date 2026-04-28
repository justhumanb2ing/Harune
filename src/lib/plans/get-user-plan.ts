import { eq } from "drizzle-orm";

import type { MeResponse } from "@/app/api/app/me/types";
import { db } from "@/db";
import { plans } from "@/db/schema/plans";
import { users } from "@/db/schema/user";

const getUserPlan = async (userId: string): Promise<MeResponse["currentPlan"] | null> => {
  const user = await db
    .select({
      planId: users.planId,
    })
    .from(users)
    .where(eq(users.id, userId));

  if (!user[0].planId) {
    return null;
  }

  const currentPlan = await db
    .select({
      id: plans.id,
      name: plans.name,
      codename: plans.codename,
      quotas: plans.quotas,
      default: plans.default,
    })
    .from(plans)
    .where(eq(plans.id, user[0].planId));

  if (!currentPlan[0]) {
    return null;
  }

  return currentPlan[0];
};

export default getUserPlan;
