import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/db";
import { profilePages } from "@/db/schema/profile-page";
import type { ProfileImageKind } from "@/lib/profile-page/image-upload";
import {
  getProfileBentoMediaPublicUrl,
  getTemporaryProfileBentoMediaObjectKey,
  hashProfileBentoMediaBuffer,
  putTemporaryProfileBentoMediaObject,
} from "@/lib/profile-page/media-storage";
import {
  createLinkItem,
  createTextBoxItem,
  deleteLinkItem,
  deleteTextBoxItem,
  isHandleAvailableForUser,
  ProfilePageError,
  reorderLinkItems,
  reorderTextBoxItems,
  syncProfileBentoDraft,
  syncProfilePageDraft,
  updateLinkItem,
  updateProfileMetadata,
  updateTextBoxItem,
} from "@/lib/profile-page/mutations";
import { getProfilePageEditorData } from "@/lib/profile-page/queries";
import {
  getMissingS3ConfigKeys,
  getPublicS3ObjectUrl,
  getS3ObjectKeyFromPublicUrl,
} from "@/lib/s3/config";
import createS3UploadFields from "@/lib/s3/create-s3-upload-fields";
import { deletePublicS3Object } from "@/lib/s3/delete-object";
import { createProfilePageApi } from "./app";

const updateProfileImage = async ({
  imageKind,
  imageUrl,
  userId,
}: {
  imageKind: ProfileImageKind;
  imageUrl: string;
  userId: string;
}) => {
  const updateValues =
    imageKind === "background" ? { backgroundImage: imageUrl } : { image: imageUrl };

  return db
    .update(profilePages)
    .set({
      ...updateValues,
      updatedAt: new Date(),
    })
    .where(eq(profilePages.userId, userId))
    .returning({
      backgroundImage: profilePages.backgroundImage,
      image: profilePages.image,
    })
    .then((rows) => rows[0] ?? null);
};

export const profilePageApi = createProfilePageApi({
  auth,
  createS3UploadFields,
  createLinkItem,
  createTextBoxItem,
  deletePublicS3Object,
  deleteLinkItem,
  deleteTextBoxItem,
  getMissingS3ConfigKeys,
  getProfilePageEditorData,
  getProfileBentoMediaPublicUrl,
  getPublicS3ObjectUrl,
  getS3ObjectKeyFromPublicUrl,
  getTemporaryProfileBentoMediaObjectKey,
  hashProfileBentoMediaBuffer,
  isHandleAvailableForUser,
  isProfilePageError: (error): error is ProfilePageError => error instanceof ProfilePageError,
  reorderLinkItems,
  reorderTextBoxItems,
  putTemporaryProfileBentoMediaObject,
  revalidatePath,
  syncProfileBentoDraft,
  syncProfilePageDraft,
  updateProfileImage,
  updateLinkItem,
  updateProfileMetadata,
  updateTextBoxItem,
});
