import { betterAuthServer } from "@/auth";
import withOrganizationAuthRequired from "@/lib/auth/withOrganizationAuthRequired";
import type { OrganizationRole } from "@/lib/organizations/types";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

const createInvitationSchema = z.object({
  email: z.string().email(),
  role: z.enum(["owner", "admin", "user"] as const).default("user"),
  resend: z.boolean().optional(),
});

export const GET = withOrganizationAuthRequired(async (_req, context) => {
  const organization = await context.session.organization;

  const invitations = await betterAuthServer.api.listInvitations({
    query: {
      organizationId: organization.id,
    },
    headers: await headers(),
  });

  return NextResponse.json({ invitations });
}, "admin");

export const POST = withOrganizationAuthRequired(async (req, context) => {
  const parseResult = createInvitationSchema.safeParse(await req.json());

  if (!parseResult.success) {
    return NextResponse.json(
      { error: "Bad Request", details: parseResult.error.issues },
      { status: 400 }
    );
  }

  const organization = await context.session.organization;

  const invitation = await betterAuthServer.api.createInvitation({
    body: {
      email: parseResult.data.email,
      role: parseResult.data.role as OrganizationRole,
      resend: parseResult.data.resend,
      organizationId: organization.id,
    },
    headers: await headers(),
  });

  return NextResponse.json({ invitation });
}, "admin");
