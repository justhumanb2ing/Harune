import { normalizeAnalyticsTimezone } from "@/lib/analytics/analytics-ranges";
import type { ProfileAnalyticsResponse } from "@/lib/analytics/types";
import type { MeResponse } from "@/lib/api/app/types";
import type { OnboardingInput } from "@/lib/validations/auth.schema";
import type { ProfileUpdateValues } from "@/lib/validations/profile.schema";

type UploadInput = {
  fileName?: string;
  fileSize?: number;
  fileType?: string;
};

export type AppApiServices = {
  createAvatarUpload(input: {
    body: UploadInput;
    userId: string;
  }): Promise<
    | { error: string; status: number }
    | { fields: Record<string, string>; publicUrl: string; url: string }
  >;
  createInputImageUpload(input: {
    body: UploadInput;
    userId: string;
  }): Promise<{ error: string; status: number } | { fields: Record<string, string>; url: string }>;
  createProfile(input: {
    userId: string;
    values: OnboardingInput;
  }): Promise<
    | { error: string; status: number }
    | { page: { handle: string; id: string; name: string }; success: true }
  >;
  getAnalytics(input: {
    timezoneHeader?: string | null;
    userId: string;
  }): Promise<ProfileAnalyticsResponse>;
  getMe(userId: string): Promise<MeResponse>;
  updateMe(input: {
    userId: string;
    values: ProfileUpdateValues;
  }): Promise<MeResponse["user"] | null>;
};

export type AppApiServiceDependencies = {
  createProfilePage: (input: {
    userId: string;
    values: OnboardingInput;
  }) => Promise<{ handle: string; id: string; name: string }>;
  createS3UploadFields: (input: {
    contentType?: string;
    maxSize?: number;
    path: string;
  }) => Promise<{ fields: Record<string, string>; url: string }>;
  getMissingS3ConfigKeys: () => string[];
  getOwnedProfilePage: (userId: string) => Promise<{ id: string } | null>;
  getProfileAnalyticsResponse: (input: {
    profilePageId: string | null;
    timezone?: string | null;
  }) => Promise<ProfileAnalyticsResponse>;
  getPublicS3ObjectUrl: (key: string) => string;
  getMeForUser: (userId: string) => Promise<MeResponse>;
  getProfilePageByHandle: (handle: string) => Promise<{ id: string } | null>;
  getUserExists: (userId: string) => Promise<boolean>;
  updateUserProfile: (input: {
    userId: string;
    values: ProfileUpdateValues;
  }) => Promise<MeResponse["user"] | null>;
};

export const createAppApiServices = ({
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
}: AppApiServiceDependencies): AppApiServices => ({
  createAvatarUpload: async ({ body, userId }) => {
    const missingConfigKeys = getMissingS3ConfigKeys();

    if (missingConfigKeys.length > 0) {
      return {
        error: `S3 storage is not configured: ${missingConfigKeys.join(", ")}`,
        status: 500,
      };
    }

    if (!body.fileName || !body.fileType || !body.fileSize) {
      return { error: "Missing required fields: fileName, fileType, fileSize", status: 400 };
    }

    if (!body.fileType.startsWith("image/")) {
      return { error: "Only image files are allowed for avatars", status: 400 };
    }

    const maxSize = 5 * 1024 * 1024;

    if (body.fileSize > maxSize) {
      return { error: "File size too large. Maximum allowed size is 5MB", status: 400 };
    }

    const fileExtension = body.fileName.split(".").pop()?.toLowerCase() || "jpg";
    const fileUuid = crypto.randomUUID();
    const s3Path = `public/users/${userId}/avatars/${fileUuid}.${fileExtension}`;
    const presignedPost = await createS3UploadFields({
      contentType: body.fileType,
      maxSize,
      path: s3Path,
    });

    return {
      fields: presignedPost.fields,
      publicUrl: getPublicS3ObjectUrl(s3Path),
      url: presignedPost.url,
    };
  },
  createInputImageUpload: async ({ body, userId }) => {
    if (!body.fileName || !body.fileType || !body.fileSize) {
      return { error: "Missing required fields: fileName, fileType, fileSize", status: 400 };
    }

    if (!body.fileType.startsWith("image/")) {
      return { error: "Only image files are allowed", status: 400 };
    }

    const fileExtension = body.fileName.split(".").pop()?.toLowerCase() || "jpg";
    const fileUuid = crypto.randomUUID();
    const s3Path = `public/users/${userId}/images/${fileUuid}.${fileExtension}`;
    const presignedPost = await createS3UploadFields({
      contentType: body.fileType,
      maxSize: body.fileSize,
      path: s3Path,
    });

    return {
      fields: presignedPost.fields,
      url: presignedPost.url,
    };
  },
  createProfile: async ({ userId, values }) => {
    const currentUserExists = await getUserExists(userId);

    if (!currentUserExists) {
      return { error: "User not found", status: 404 };
    }

    const existingOwner = await getProfilePageByHandle(values.handle);

    if (existingOwner) {
      return { error: "This handle is already taken.", status: 409 };
    }

    return {
      page: await createProfilePage({ userId, values }),
      success: true,
    };
  },
  getAnalytics: async ({ timezoneHeader, userId }) => {
    const timezone = normalizeAnalyticsTimezone(timezoneHeader);
    const profilePage = await getOwnedProfilePage(userId);

    return getProfileAnalyticsResponse({
      profilePageId: profilePage?.id ?? null,
      timezone,
    });
  },
  getMe: getMeForUser,
  updateMe: updateUserProfile,
});
