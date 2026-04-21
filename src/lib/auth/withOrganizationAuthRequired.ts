import { auth } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema/user";
import { getUserOrganizationBySlug } from "@/lib/organizations";
import { hasHigherOrEqualRole } from "@/lib/organizations/roles";
import type { OrganizationRole, UserOrganizationWithPlan } from "@/lib/organizations/types";
import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";

type RouteParams = Record<string, string | string[] | undefined>;

type OrganizationAuthContext = {
  session: {
    expires: string;
    user: Promise<{
      id: string;
      email: string;
      name: string | null;
      image: string | null;
    }>;
    organization: Promise<UserOrganizationWithPlan>;
  };
  params: Promise<RouteParams>;
};

type WithOrganizationHandler = (
  req: NextRequest,
  context: OrganizationAuthContext
) => Promise<Response | NextResponse>;

export const withOrganizationAuthRequired = (
  handler: WithOrganizationHandler,
  requiredRole?: OrganizationRole
) => {
  return async (
    req: NextRequest,
    context: {
      params: Promise<RouteParams>;
    }
  ) => {
    const session = await auth();

    if (!session?.user?.id || !session.user.email) {
      return NextResponse.json(
        {
          error: "Unauthorized",
          message: "You must be logged in to access this resource",
        },
        { status: 401 }
      );
    }

    const params = await context.params;
    const slug = typeof params.slug === "string" ? params.slug : undefined;

    if (!slug) {
      return NextResponse.json(
        {
          error: "Bad Request",
          message: "Organization slug is required",
        },
        { status: 400 }
      );
    }

    const organization = await getUserOrganizationBySlug({
      userId: session.user.id,
      slug,
    });

    if (!organization) {
      return NextResponse.json(
        {
          error: "Not Found",
          message: "Organization not found",
        },
        { status: 404 }
      );
    }

    if (
      requiredRole &&
      !hasHigherOrEqualRole({
        currentRole: organization.role,
        requiredRole,
      })
    ) {
      return NextResponse.json(
        {
          error: "Forbidden",
          message: "Insufficient permissions",
        },
        { status: 403 }
      );
    }

    const user = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        image: users.image,
      })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1)
      .then((items) => items[0]);

    return handler(req, {
      session: {
        expires: session.expires,
        user: Promise.resolve({
          id: user?.id ?? session.user.id,
          email: user?.email ?? session.user.email,
          name: user?.name ?? null,
          image: user?.image ?? null,
        }),
        organization: Promise.resolve(organization),
      },
      params: Promise.resolve(params),
    });
  };
};

export default withOrganizationAuthRequired;
