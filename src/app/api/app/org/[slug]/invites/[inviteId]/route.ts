import { betterAuthServer } from "@/auth";
import withOrganizationAuthRequired from "@/lib/auth/withOrganizationAuthRequired";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export const DELETE = withOrganizationAuthRequired(async (_req, context) => {
  const params = await context.params;
  const inviteId = typeof params.inviteId === "string" ? params.inviteId : undefined;

  if (!inviteId) {
    return NextResponse.json(
      { error: "Bad Request", message: "inviteId가 필요합니다." },
      { status: 400 }
    );
  }

  const invitation = await betterAuthServer.api.cancelInvitation({
    body: { invitationId: inviteId },
    headers: await headers(),
  });

  return NextResponse.json({ invitation });
}, "admin");
