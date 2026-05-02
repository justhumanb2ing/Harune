import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema/user";
import { getProfileAnalyticsResponse } from "@/lib/analytics/profile-page-summary";
import { getOwnedProfilePage } from "@/lib/profile-page/queries";
import { getMissingS3ConfigKeys, getPublicS3ObjectUrl } from "@/lib/s3/config";
import createS3UploadFields from "@/lib/s3/create-s3-upload-fields";
import { getMeForUser } from "@/lib/users/me";
import type { ProfileUpdateValues } from "@/lib/validations/profile.schema";
import { toAppApiRequest } from "./adapter";
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

export const appApi = createAppApi({
  auth,
  createS3UploadFields,
  getMissingS3ConfigKeys,
  getOwnedProfilePage,
  getProfileAnalyticsResponse,
  getPublicS3ObjectUrl,
  getMeForUser,
  updateUserProfile,
});

export const handleAppApiRequest = (req: Request) => appApi.fetch(toAppApiRequest(req));
