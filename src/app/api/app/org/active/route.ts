import { betterAuthServer } from "@/auth";
import withAuthRequired from "@/lib/auth/withAuthRequired";
import {
  getUserOrganizationById,
  getUserOrganizationBySlug,
  getUserOrganizations,
} from "@/lib/organizations";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

const switchOrganizationSchema = z
  .object({
    organizationId: z.string().nullable().optional(),
    organizationSlug: z.string().optional(),
  })
  .refine((value) => !!value.organizationId || !!value.organizationSlug, {
    message: "organizationId 또는 organizationSlug 중 하나는 필수입니다.",
  });

export const GET = withAuthRequired(async (_req, context) => {
  const userId = context.session.user.id;
  let activeOrganizationId = context.session.activeOrganizationId;

  if (!activeOrganizationId) {
    const organizations = await getUserOrganizations(userId);
    const fallbackOrganization = organizations[0];

    if (!fallbackOrganization) {
      return NextResponse.json({ organization: null });
    }

    await betterAuthServer.api.setActiveOrganization({
      body: { organizationId: fallbackOrganization.id },
      headers: await headers(),
    });

    activeOrganizationId = fallbackOrganization.id;
  }

  const organization = await getUserOrganizationById({
    userId,
    organizationId: activeOrganizationId,
  });

  if (!organization) {
    const organizations = await getUserOrganizations(userId);
    const fallbackOrganization = organizations[0];

    if (!fallbackOrganization) {
      return NextResponse.json({ organization: null });
    }

    await betterAuthServer.api.setActiveOrganization({
      body: { organizationId: fallbackOrganization.id },
      headers: await headers(),
    });

    return NextResponse.json({ organization: fallbackOrganization });
  }

  return NextResponse.json({ organization });
});

export const POST = withAuthRequired(async (req, context) => {
  const parseResult = switchOrganizationSchema.safeParse(await req.json());

  if (!parseResult.success) {
    return NextResponse.json(
      {
        error: "Bad Request",
        details: parseResult.error.issues,
      },
      { status: 400 }
    );
  }

  const { organizationId, organizationSlug } = parseResult.data;

  await betterAuthServer.api.setActiveOrganization({
    body: {
      organizationId: organizationId ?? undefined,
      organizationSlug,
    },
    headers: await headers(),
  });

  const organization = organizationId
    ? await getUserOrganizationById({
        userId: context.session.user.id,
        organizationId,
      })
    : organizationSlug
      ? await getUserOrganizationBySlug({
          userId: context.session.user.id,
          slug: organizationSlug,
        })
      : null;

  return NextResponse.json({ organization });
});
