import { betterAuthServer } from "@/auth";
import withOrganizationAuthRequired from "@/lib/auth/withOrganizationAuthRequired";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export const GET = withOrganizationAuthRequired(async (_req, context) => {
  const organization = await context.session.organization;

  const members = await betterAuthServer.api.listMembers({
    query: {
      organizationId: organization.id,
    },
    headers: await headers(),
  });

  return NextResponse.json({ members });
});
