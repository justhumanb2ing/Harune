import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/db";
import { profilePages } from "@/db/schema/profile";
import type { ProfileImageKind } from "@/lib/profile/image-upload";
import {
  deleteProfileMediaObject,
  getProfileMediaObjectKeyFromUrl,
  getProfileMediaPublicUrl,
  getTemporaryProfileBentoMediaObjectKey,
  hashProfileMediaBuffer,
  putProfileMediaObject,
} from "@/lib/profile/media-storage";
import {
  isHandleAvailableForUser,
  ProfilePageError,
  syncProfileBentoDraft,
  syncProfilePageDraft,
  updateProfileMetadata,
} from "@/lib/profile/mutations";
import { getProfilePageEditorData } from "@/lib/profile/queries";
import { createProfileApi } from "./app";

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

export const profileApi = createProfileApi({
  auth,
  deleteProfileMediaObject,
  getProfilePageEditorData,
  getProfileMediaPublicUrl,
  getProfileMediaObjectKeyFromUrl,
  getTemporaryProfileBentoMediaObjectKey,
  hashProfileMediaBuffer,
  isHandleAvailableForUser,
  isProfilePageError: (error): error is ProfilePageError => error instanceof ProfilePageError,
  putProfileMediaObject,
  revalidatePath,
  syncProfileBentoDraft,
  syncProfilePageDraft,
  updateProfileImage,
  updateProfileMetadata,
});
