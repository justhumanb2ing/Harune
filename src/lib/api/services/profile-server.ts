import { revalidatePath, revalidateTag } from "next/cache";
import { auth } from "@/auth";
import { updateProfileImage } from "@/lib/api/repositories/profile";
import { createProfileApi } from "@/lib/api/routes/profile";
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
import { getProfilePageEditorData, PUBLIC_PROFILE_BENTO_CACHE_TAG } from "@/lib/profile/queries";

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
  revalidatePublicProfileCache: () => {
    revalidateTag(PUBLIC_PROFILE_BENTO_CACHE_TAG, { expire: 0 });
  },
  syncProfileBentoDraft,
  syncProfilePageDraft,
  updateProfileImage,
  updateProfileMetadata,
});
