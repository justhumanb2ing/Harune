import { getProfileAppPath } from "@/lib/profile/app-paths";
import {
  getProfileImageFileError,
  getProfileImageKind,
  getProfileImageObjectKey,
  type ProfileImageKind,
} from "@/lib/profile/image-upload";
import {
  getProfileBentoMediaFileError,
  getProfileBentoMediaType,
} from "@/lib/profile/media-upload";
import type { ProfileMediaType } from "@/lib/profile/types";
import type {
  ProfileBentoSyncValues,
  ProfilePageSyncValues,
  ProfilePageUpdateValues,
} from "@/lib/validations/profile-content.schema";

type ServiceError = {
  error: string;
  status: number;
};

export type ProfileApiServices = {
  deleteProfileImage(input: {
    imageUrl?: string;
    userId: string;
  }): Promise<ServiceError | { success: true }>;
  finalizeProfileImage(input: {
    imageKind?: string;
    imageUrl?: string;
    userId: string;
  }): Promise<ServiceError | { imageUrl: string | null }>;
  getEditorData(input: { handle?: string; userId: string }): Promise<unknown | null>;
  getProfileError(error: unknown): ServiceError | null;
  syncBento(input: {
    userId: string;
    values: ProfileBentoSyncValues;
  }): Promise<{ page: { handle: string } }>;
  syncPage(input: {
    userId: string;
    values: ProfilePageSyncValues;
  }): Promise<{ page: { handle: string } }>;
  updateMetadata(input: { userId: string; values: ProfilePageUpdateValues }): Promise<unknown>;
  uploadBentoMedia(input: {
    bentoId: FormDataEntryValue | null;
    file: FormDataEntryValue | null;
    userId: string;
  }): Promise<
    | ServiceError
    | {
        contentHash: string;
        contentType: string;
        mediaType: ProfileMediaType;
        tempObjectKey: string;
        tempUrl: string;
      }
  >;
  uploadProfileImage(input: {
    file: FormDataEntryValue | null;
    imageHash: FormDataEntryValue | null;
    imageKind: FormDataEntryValue | null;
    userId: string;
  }): Promise<ServiceError | { imageUrl: string }>;
};

export type ProfileApiServiceDependencies = {
  deleteProfileMediaObject: (objectKey: string) => Promise<unknown>;
  getProfileMediaPublicUrl: (input: { contentHash: string; objectKey: string }) => string;
  getProfileMediaObjectKeyFromUrl: (publicUrl: string) => string | null;
  getProfilePageEditorData: (userId: string, handle?: string) => Promise<unknown | null>;
  getTemporaryProfileBentoMediaObjectKey: (input: { bentoId: string; userId: string }) => string;
  hashProfileMediaBuffer: (buffer: Buffer) => string;
  isProfilePageError?: (error: unknown) => error is { message: string; status: number };
  putProfileMediaObject: (input: {
    body: Buffer;
    contentType: string;
    objectKey: string;
  }) => Promise<void>;
  revalidatePath: (path: string) => void;
  revalidatePublicProfileCache: () => void;
  syncProfilePageDraft: (input: {
    userId: string;
    values: ProfilePageSyncValues;
  }) => Promise<{ page: { handle: string } }>;
  syncProfileBentoDraft: (input: {
    userId: string;
    values: ProfileBentoSyncValues;
  }) => Promise<{ page: { handle: string } }>;
  updateProfileImage: (input: {
    imageKind: ProfileImageKind;
    imageUrl: string;
    userId: string;
  }) => Promise<{ backgroundImage: string | null; image: string | null } | null>;
  updateProfileMetadata: (input: {
    userId: string;
    values: ProfilePageUpdateValues;
  }) => Promise<unknown>;
};

export const createProfileApiServices = ({
  deleteProfileMediaObject,
  getProfileMediaPublicUrl,
  getProfileMediaObjectKeyFromUrl,
  getProfilePageEditorData,
  getTemporaryProfileBentoMediaObjectKey,
  hashProfileMediaBuffer,
  isProfilePageError = (_error): _error is { message: string; status: number } => false,
  putProfileMediaObject,
  revalidatePath,
  revalidatePublicProfileCache,
  syncProfileBentoDraft,
  syncProfilePageDraft,
  updateProfileImage,
  updateProfileMetadata,
}: ProfileApiServiceDependencies): ProfileApiServices => {
  const revalidateProfile = (handle: string) => {
    revalidatePath(getProfileAppPath(handle));
    revalidatePublicProfileCache();
  };

  return {
    deleteProfileImage: async ({ imageUrl, userId }) => {
      if (!imageUrl) {
        return { error: "Missing required field: imageUrl", status: 400 };
      }

      const objectKey = getProfileMediaObjectKeyFromUrl(imageUrl);
      const expectedPrefix = `public/users/${userId}/profile/`;

      if (!objectKey?.startsWith(expectedPrefix)) {
        return { error: "Invalid profile image URL.", status: 400 };
      }

      await deleteProfileMediaObject(objectKey);

      return { success: true };
    },
    finalizeProfileImage: async ({ imageKind, imageUrl, userId }) => {
      const profileImageKind = getProfileImageKind(imageKind);

      if (!profileImageKind || !imageUrl) {
        return { error: "Invalid profile image payload.", status: 400 };
      }

      const objectKey = getProfileMediaObjectKeyFromUrl(imageUrl);
      const expectedKey = getProfileImageObjectKey(userId, profileImageKind);

      if (objectKey !== expectedKey) {
        return { error: "Invalid profile image URL.", status: 400 };
      }

      const updatedPage = await updateProfileImage({
        imageKind: profileImageKind,
        imageUrl,
        userId,
      });

      if (!updatedPage) {
        return { error: "Profile page not found.", status: 404 };
      }

      return {
        imageUrl:
          profileImageKind === "background" ? updatedPage.backgroundImage : updatedPage.image,
      };
    },
    getEditorData: ({ handle, userId }) => getProfilePageEditorData(userId, handle),
    getProfileError: (error) => {
      if (!isProfilePageError(error)) {
        return null;
      }

      return {
        error: error.message,
        status: error.status,
      };
    },
    syncBento: async (input) => {
      const data = await syncProfileBentoDraft(input);
      revalidateProfile(data.page.handle);

      return data;
    },
    syncPage: async (input) => {
      const data = await syncProfilePageDraft(input);
      revalidateProfile(data.page.handle);

      return data;
    },
    updateMetadata: updateProfileMetadata,
    uploadBentoMedia: async ({ bentoId, file, userId }) => {
      if (!(file instanceof File) || typeof bentoId !== "string" || bentoId.trim().length === 0) {
        return { error: "Missing required media upload fields.", status: 400 };
      }

      const fileError = getProfileBentoMediaFileError(file);

      if (fileError) {
        return { error: fileError, status: 400 };
      }

      const mediaType = getProfileBentoMediaType(file.type);

      if (!mediaType) {
        return { error: "Unsupported media type.", status: 400 };
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const contentHash = hashProfileMediaBuffer(buffer);
      const tempObjectKey = getTemporaryProfileBentoMediaObjectKey({
        bentoId,
        userId,
      });

      await putProfileMediaObject({
        body: buffer,
        contentType: file.type,
        objectKey: tempObjectKey,
      });

      return {
        contentHash,
        contentType: file.type,
        mediaType: mediaType satisfies ProfileMediaType,
        tempObjectKey,
        tempUrl: getProfileMediaPublicUrl({
          contentHash,
          objectKey: tempObjectKey,
        }),
      };
    },
    uploadProfileImage: async ({ file, imageHash, imageKind, userId }) => {
      if (!(file instanceof File) || typeof imageKind !== "string") {
        return { error: "Missing required profile image upload fields.", status: 400 };
      }

      const imageError = getProfileImageFileError(file);

      if (imageError) {
        return { error: imageError, status: 400 };
      }

      const profileImageKind = getProfileImageKind(imageKind);

      if (!profileImageKind) {
        return { error: "Invalid profile image kind.", status: 400 };
      }

      if (typeof imageHash !== "string" || !/^[a-f0-9]{64}$/i.test(imageHash)) {
        return { error: "Invalid profile image hash.", status: 400 };
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const contentHash = hashProfileMediaBuffer(buffer);

      if (contentHash !== imageHash.toLowerCase()) {
        return { error: "Profile image hash mismatch.", status: 400 };
      }

      const objectKey = getProfileImageObjectKey(userId, profileImageKind);

      await putProfileMediaObject({
        body: buffer,
        contentType: file.type,
        objectKey,
      });

      return {
        imageUrl: getProfileMediaPublicUrl({
          contentHash,
          objectKey,
        }),
      };
    },
  };
};
