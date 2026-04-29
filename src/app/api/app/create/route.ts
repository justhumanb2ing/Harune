import { eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { profilePages, profileSocialLinks } from "@/db/schema/profile-page";
import { users } from "@/db/schema/user";
import withAuthRequired from "@/lib/auth/with-auth-required";
import { MAX_PROFILE_PAGE_COUNT } from "@/lib/profile-page/limits";
import { onboardingSchema } from "@/lib/validations/auth.schema";

class ProfilePageLimitError extends Error {
  status = 403;

  constructor() {
    super(`You can only create up to ${MAX_PROFILE_PAGE_COUNT} pages.`);
    this.name = "ProfilePageLimitError";
  }
}

export const POST = withAuthRequired(async (req, context) => {
  const currentUser = await db
    .select({
      id: users.id,
    })
    .from(users)
    .where(eq(users.id, context.session.user.id))
    .limit(1)
    .then((rows) => rows[0]);

  if (!currentUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const body = await req.json();
  const validation = onboardingSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      {
        error: validation.error.issues[0]?.message ?? "Invalid handle.",
      },
      { status: 400 }
    );
  }

  const { backgroundImage, bio, handle, image, location, name, role, socialLinks } =
    validation.data;
  const existingOwner = await db
    .select({
      id: profilePages.id,
    })
    .from(profilePages)
    .where(eq(profilePages.handle, handle))
    .limit(1)
    .then((rows) => rows[0]);

  if (existingOwner) {
    return NextResponse.json({ error: "This handle is already taken." }, { status: 409 });
  }

  try {
    const createdPage = await db.transaction(async (tx) => {
      await tx
        .update(users)
        .set({
          name,
          image: image ?? null,
          updatedAt: new Date(),
        })
        .where(eq(users.id, context.session.user.id));

      const currentPageCount = await tx
        .select({
          count: sql<number>`count(*)`,
        })
        .from(profilePages)
        .where(eq(profilePages.userId, context.session.user.id))
        .then((rows) => Number(rows[0]?.count ?? 0));

      if (currentPageCount >= MAX_PROFILE_PAGE_COUNT) {
        throw new ProfilePageLimitError();
      }

      const page = await tx
        .insert(profilePages)
        .values({
          userId: context.session.user.id,
          name,
          location: location ?? null,
          role: role ?? null,
          bio: bio ?? null,
          image: image ?? null,
          backgroundImage: backgroundImage ?? null,
          handle,
          updatedAt: new Date(),
        })
        .returning({
          id: profilePages.id,
          handle: profilePages.handle,
          name: profilePages.name,
        })
        .then((rows) => rows[0]);

      const socialLinkValues = Object.entries(socialLinks)
        .filter(([, value]) => typeof value === "string" && value.length > 0)
        .map(([platform, url], index) => ({
          profilePageId: page.id,
          platform: platform as (typeof profileSocialLinks.$inferInsert)["platform"],
          url,
          position: index,
          updatedAt: new Date(),
        }));

      if (socialLinkValues.length > 0) {
        await tx.insert(profileSocialLinks).values(socialLinkValues);
      }

      return page;
    });

    return NextResponse.json({
      success: true,
      page: createdPage,
    });
  } catch (error) {
    if (error instanceof ProfilePageLimitError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    throw error;
  }
});
