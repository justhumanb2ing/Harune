import { db } from "@/db";
import { profilePages } from "@/db/schema/profile-page";
import { users } from "@/db/schema/user";
import withAuthRequired from "@/lib/auth/withAuthRequired";
import { onboardingSchema } from "@/lib/validations/auth.schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

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

  const existingOwnedPage = await db
    .select({
      id: profilePages.id,
    })
    .from(profilePages)
    .where(eq(profilePages.userId, context.session.user.id))
    .limit(1)
    .then((rows) => rows[0]);

  if (existingOwnedPage) {
    return NextResponse.json(
      { error: "Onboarding is only available before page creation." },
      { status: 403 }
    );
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

  const { bio, handle, image, name, socialLinks } = validation.data;
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

  const createdPages = await db
    .insert(profilePages)
    .values({
      userId: context.session.user.id,
      name,
      bio: bio ?? null,
      image: image ?? null,
      handle,
      socialLinks,
    })
    .returning({
      id: profilePages.id,
      handle: profilePages.handle,
      name: profilePages.name,
    });

  return NextResponse.json({
    success: true,
    page: createdPages[0],
  });
});
