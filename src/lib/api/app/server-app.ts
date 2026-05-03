import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { profilePages, profileSocialLinks } from "@/db/schema/profile";
import { users } from "@/db/schema/user";
import { getProfileAnalyticsResponse } from "@/lib/analytics/profile-summary";
import { getOwnedProfilePage } from "@/lib/profile/queries";
import { getMissingS3ConfigKeys, getPublicS3ObjectUrl } from "@/lib/s3/config";
import createS3UploadFields from "@/lib/s3/create-s3-upload-fields";
import { getMeForUser } from "@/lib/users/me";
import type { OnboardingInput } from "@/lib/validations/auth.schema";
import type { ProfileUpdateValues } from "@/lib/validations/profile.schema";
import { createAppApi } from "./app";

const updateUserProfile = async ({
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

const getUserExists = async (userId: string) => {
  return db
    .select({
      id: users.id,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)
    .then((rows) => Boolean(rows[0]));
};

const getProfilePageByHandle = async (handle: string) => {
  return db
    .select({
      id: profilePages.id,
    })
    .from(profilePages)
    .where(eq(profilePages.handle, handle))
    .limit(1)
    .then((rows) => rows[0] ?? null);
};

const createProfilePage = async ({
  userId,
  values,
}: {
  userId: string;
  values: OnboardingInput;
}) => {
  const { backgroundImage, bio, handle, image, location, name, role, socialLinks } = values;

  return db.transaction(async (tx) => {
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

    const socialLinkValues = Object.entries(socialLinks)
      .filter(([, value]) => typeof value === "string" && value.length > 0)
      .map(([platform, url], index) => ({
        platform: platform as (typeof profileSocialLinks.$inferInsert)["platform"],
        position: index,
        profilePageId: page.id,
        updatedAt: new Date(),
        url,
      }));

    if (socialLinkValues.length > 0) {
      await tx.insert(profileSocialLinks).values(socialLinkValues);
    }

    return {
      handle: page.handle,
      id: page.id,
      name,
    };
  });
};

export const appApi = createAppApi({
  auth,
  createProfilePage,
  createS3UploadFields,
  getMissingS3ConfigKeys,
  getOwnedProfilePage,
  getProfileAnalyticsResponse,
  getPublicS3ObjectUrl,
  getMeForUser,
  getProfilePageByHandle,
  getUserExists,
  updateUserProfile,
});
