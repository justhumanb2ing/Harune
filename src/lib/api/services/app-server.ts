import { auth } from "@/auth";
import {
  createProfilePage,
  getProfilePageByHandle,
  getUserExists,
  updateUserProfile,
} from "@/lib/api/repositories/app";
import { createAppApi } from "@/lib/api/routes/app";
import { getMissingS3ConfigKeys, getPublicS3ObjectUrl } from "@/lib/s3/config";
import createS3UploadFields from "@/lib/s3/create-s3-upload-fields";
import { getMeForUser } from "@/lib/users/me";

export const appApi = createAppApi({
  auth,
  createProfilePage,
  createS3UploadFields,
  getMissingS3ConfigKeys,
  getPublicS3ObjectUrl,
  getMeForUser,
  getProfilePageByHandle,
  getUserExists,
  updateUserProfile,
});
