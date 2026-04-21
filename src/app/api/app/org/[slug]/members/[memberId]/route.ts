import { betterAuthServer } from "@/auth";
import withOrganizationAuthRequired from "@/lib/auth/withOrganizationAuthRequired";
import type { OrganizationRole } from "@/lib/organizations/types";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

const updateRoleSchema = z.object({
  role: z.enum(["owner", "admin", "user"] as const),
});

export const PATCH = withOrganizationAuthRequired(async (req, context) => {
  const params = await context.params;
  const memberId = typeof params.memberId === "string" ? params.memberId : undefined;

  if (!memberId) {
    return NextResponse.json(
      { error: "Bad Request", message: "memberId가 필요합니다." },
      { status: 400 }
    );
  }

  const parseResult = updateRoleSchema.safeParse(await req.json());
  if (!parseResult.success) {
    return NextResponse.json(
      { error: "Bad Request", details: parseResult.error.issues },
      { status: 400 }
    );
  }

  const organization = await context.session.organization;

  const member = await betterAuthServer.api.updateMemberRole({
    body: {
      memberId,
      role: parseResult.data.role as OrganizationRole,
      organizationId: organization.id,
    },
    headers: await headers(),
  });

  return NextResponse.json({ member });
}, "admin");

export const DELETE = withOrganizationAuthRequired(async (_req, context) => {
  const params = await context.params;
  const memberId = typeof params.memberId === "string" ? params.memberId : undefined;

  if (!memberId) {
    return NextResponse.json(
      { error: "Bad Request", message: "memberId가 필요합니다." },
      { status: 400 }
    );
  }

  const organization = await context.session.organization;

  const removedMember = await betterAuthServer.api.removeMember({
    body: {
      memberIdOrEmail: memberId,
      organizationId: organization.id,
    },
    headers: await headers(),
  });

  return NextResponse.json({ member: removedMember });
}, "admin");
