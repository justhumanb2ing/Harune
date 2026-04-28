import { eq } from "drizzle-orm";
import type { NextRequest, NextResponse } from "next/server";
import type { MeResponse } from "@/app/api/app/me/types";
import type { AuthSession } from "@/auth";
import { auth } from "@/auth";
import { db } from "@/db";
import { plans } from "@/db/schema/plans";
import { users } from "@/db/schema/user";
import { createUnauthorizedResponse } from "@/lib/auth/responses";

type WithManagerHandler = (
  req: NextRequest,
  context: {
    session: NonNullable<
      AuthSession & {
        user: {
          id: string;
          email: string;
        };
      }
    >;
    getCurrentPlan: () => Promise<MeResponse["currentPlan"]>;
    getUser: () => Promise<MeResponse["user"]>;
    params: Promise<Record<string, unknown>>;
  }
) => Promise<NextResponse | Response>;

const withAuthRequired = (handler: WithManagerHandler) => {
  return async (
    req: NextRequest,
    context: {
      params: Promise<Record<string, unknown>>;
    }
  ) => {
    const session = await auth();

    if (!session || !session.user || !session.user.id || !session.user.email) {
      return createUnauthorizedResponse();
    }

    const userId = session.user.id;

    const getCurrentPlan = async () => {
      const user = await db.select().from(users).where(eq(users.id, userId));

      if (!user) {
        return null;
      }

      // Get the current plan and quotas

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

      if (!currentPlan.length) {
        return null;
      }

      return currentPlan[0];
    };

    const getUser = async () => {
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
        .then((users) => users[0]);
      return user;
    };

    return await handler(req, {
      ...context,
      session: session,
      getCurrentPlan,
      getUser,
    });
  };
};

export default withAuthRequired;
