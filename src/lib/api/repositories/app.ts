import { eq } from "drizzle-orm";
import { db } from "@/db";
import { profilePages } from "@/db/schema/profile";
import { users } from "@/db/schema/user";
import type { OnboardingInput } from "@/lib/validations/auth.schema";
import type { ProfileUpdateValues } from "@/lib/validations/profile.schema";

export const updateUserProfile = async ({
  userId,
  values,
}: {
  userId: string;
  values: ProfileUpdateValues;
}) => {
  return db
    .update(users)
    .set({
      image: values.image,
      name: values.name,
    })
    .where(eq(users.id, userId))
    .returning()
    .then((rows) => rows[0] ?? null);
};

export const getUserExists = async (userId: string) => {
  return db
    .select({
      id: users.id,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)
    .then((rows) => Boolean(rows[0]));
};

export const getProfilePageByHandle = async (handle: string) => {
  return db
    .select({
      id: profilePages.id,
    })
    .from(profilePages)
    .where(eq(profilePages.handle, handle))
    .limit(1)
    .then((rows) => rows[0] ?? null);
};

export const createProfilePage = async ({
  userId,
  values,
}: {
  userId: string;
  values: OnboardingInput;
}) => {
  const { backgroundImage, bio, handle, image, location, name, role } = values;

  const pageId = await db.transaction(async (tx) => {
    await tx
      .update(users)
      .set({
        image: image ?? null,
        name,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    const page = await tx
      .insert(profilePages)
      .values({
        backgroundImage: backgroundImage ?? null,
        bio: bio ?? null,
        handle,
        image: image ?? null,
        location: location ?? null,
        name,
        role: role ?? null,
        updatedAt: new Date(),
        userId,
      })
      .returning({
        handle: profilePages.handle,
        id: profilePages.id,
        name: profilePages.name,
      })
      .then((rows) => rows[0]);

    return page.id;
  });

  const committedPage = await db
    .select({
      handle: profilePages.handle,
      id: profilePages.id,
      name: profilePages.name,
    })
    .from(profilePages)
    .where(eq(profilePages.id, pageId))
    .limit(1)
    .then((rows) => rows[0] ?? null);

  if (!committedPage) {
    throw new Error("Profile page was not found after create.");
  }

  if (committedPage.name === null) {
    throw new Error("Profile page name was not persisted after create.");
  }

  return {
    handle: committedPage.handle,
    id: committedPage.id,
    name: committedPage.name,
  };
};
