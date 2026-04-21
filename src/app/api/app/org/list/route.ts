import withAuthRequired from "@/lib/auth/withAuthRequired";
import { getUserOrganizations } from "@/lib/organizations";
import { NextResponse } from "next/server";

export const GET = withAuthRequired(async (_req, context) => {
  const organizations = await getUserOrganizations(context.session.user.id);
  return NextResponse.json({ organizations });
});
