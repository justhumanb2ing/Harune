import type { AuthSession } from "@/auth";
import { normalizeAnalyticsTimezone } from "@/lib/analytics/analytics-ranges";
import type { ProfileAnalyticsResponse } from "@/lib/analytics/types";
import type { MeResponse } from "@/lib/api/app/types";
import {
  apiFactory,
  createSessionMiddleware,
  getAuthenticatedSession,
  jsonResponse,
  unauthorizedResponse,
} from "@/lib/api/hono-factory";
import { type OnboardingInput, onboardingSchema } from "@/lib/validations/auth.schema";
import { type ProfileUpdateValues, profileUpdateSchema } from "@/lib/validations/profile.schema";

type AppApiDependencies = {
  auth: () => Promise<AuthSession | null>;
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
  logger?: Pick<Console, "error">;
  updateUserProfile: (input: {
    userId: string;
    values: ProfileUpdateValues;
  }) => Promise<MeResponse["user"] | null>;
};

export const createAppApi = ({
  auth: getSession,
  createProfilePage,
  createS3UploadFields,
  getMissingS3ConfigKeys,
  getOwnedProfilePage,
  getProfileAnalyticsResponse,
  getPublicS3ObjectUrl,
  getMeForUser,
  getProfilePageByHandle,
  getUserExists,
  logger = console,
  updateUserProfile,
}: AppApiDependencies) => {
  const app = apiFactory.createApp();

  app.use("*", createSessionMiddleware(getSession));
  app.get("/me", async (context) => {
    const session = getAuthenticatedSession(context);

    if (!session) {
      return unauthorizedResponse(context);
    }

    return jsonResponse(context, await getMeForUser(session.user.id), 200);
  });
  app.patch("/me", async (context) => {
    const session = getAuthenticatedSession(context);

    if (!session) {
      return unauthorizedResponse(context);
    }

    try {
      const body = await context.req.json();
      const validationResult = profileUpdateSchema.safeParse(body);

      if (!validationResult.success) {
        return jsonResponse(
          context,
          {
            details: validationResult.error.issues,
            error: "Validation failed",
          },
          400
        );
      }

      const updatedUser = await updateUserProfile({
        userId: session.user.id,
        values: validationResult.data,
      });

      if (!updatedUser) {
        return jsonResponse(context, { error: "User not found" }, 404);
      }

      return jsonResponse(
        context,
        {
          message: "Profile updated successfully",
          user: updatedUser,
        },
        200
      );
    } catch (error) {
      logger.error("Error updating profile:", error);
      return jsonResponse(context, { error: "Failed to update profile" }, 500);
    }
  });
  app.get("/analytics", async (context) => {
    const session = getAuthenticatedSession(context);

    if (!session) {
      return unauthorizedResponse(context);
    }

    try {
      const timezone = normalizeAnalyticsTimezone(context.req.header("x-vercel-ip-timezone"));
      const profilePage = await getOwnedProfilePage(session.user.id);
      const response = await getProfileAnalyticsResponse({
        profilePageId: profilePage?.id ?? null,
        timezone,
      });

      return jsonResponse(context, response, 200);
    } catch (error) {
      logger.error("Failed to load profile analytics:", error);
      return jsonResponse(context, { error: "Failed to load profile analytics." }, 500);
    }
  });
  app.post("/me/upload-avatar", async (context) => {
    const session = getAuthenticatedSession(context);

    if (!session) {
      return unauthorizedResponse(context);
    }

    try {
      const body = (await context.req.json()) as {
        fileName?: string;
        fileSize?: number;
        fileType?: string;
      };
      const missingConfigKeys = getMissingS3ConfigKeys();

      if (missingConfigKeys.length > 0) {
        return jsonResponse(
          context,
          { error: `S3 storage is not configured: ${missingConfigKeys.join(", ")}` },
          500
        );
      }

      if (!body.fileName || !body.fileType || !body.fileSize) {
        return jsonResponse(
          context,
          { error: "Missing required fields: fileName, fileType, fileSize" },
          400
        );
      }

      if (!body.fileType.startsWith("image/")) {
        return jsonResponse(context, { error: "Only image files are allowed for avatars" }, 400);
      }

      const maxSize = 5 * 1024 * 1024;

      if (body.fileSize > maxSize) {
        return jsonResponse(
          context,
          { error: "File size too large. Maximum allowed size is 5MB" },
          400
        );
      }

      const fileExtension = body.fileName.split(".").pop()?.toLowerCase() || "jpg";
      const fileUuid = crypto.randomUUID();
      const s3Path = `public/users/${session.user.id}/avatars/${fileUuid}.${fileExtension}`;
      const presignedPost = await createS3UploadFields({
        contentType: body.fileType,
        maxSize,
        path: s3Path,
      });

      return jsonResponse(
        context,
        {
          fields: presignedPost.fields,
          publicUrl: getPublicS3ObjectUrl(s3Path),
          url: presignedPost.url,
        },
        200
      );
    } catch (error) {
      logger.error("Error creating presigned URL for avatar upload:", error);
      return jsonResponse(context, { error: "Failed to create upload URL" }, 500);
    }
  });
  app.post("/upload-input-images", async (context) => {
    const session = getAuthenticatedSession(context);

    if (!session) {
      return unauthorizedResponse(context);
    }

    try {
      const body = (await context.req.json()) as {
        fileName?: string;
        fileSize?: number;
        fileType?: string;
      };

      if (!body.fileName || !body.fileType || !body.fileSize) {
        return jsonResponse(
          context,
          { error: "Missing required fields: fileName, fileType, fileSize" },
          400
        );
      }

      if (!body.fileType.startsWith("image/")) {
        return jsonResponse(context, { error: "Only image files are allowed" }, 400);
      }

      const fileExtension = body.fileName.split(".").pop()?.toLowerCase() || "jpg";
      const fileUuid = crypto.randomUUID();
      const s3Path = `public/users/${session.user.id}/images/${fileUuid}.${fileExtension}`;
      const presignedPost = await createS3UploadFields({
        contentType: body.fileType,
        maxSize: body.fileSize,
        path: s3Path,
      });

      return jsonResponse(
        context,
        {
          fields: presignedPost.fields,
          url: presignedPost.url,
        },
        200
      );
    } catch (error) {
      logger.error("Error creating presigned URL for image upload:", error);
      return jsonResponse(context, { error: "Failed to create upload URL" }, 500);
    }
  });
  app.post("/create", async (context) => {
    const session = getAuthenticatedSession(context);

    if (!session) {
      return unauthorizedResponse(context);
    }

    const currentUserExists = await getUserExists(session.user.id);

    if (!currentUserExists) {
      return jsonResponse(context, { error: "User not found" }, 404);
    }

    const body = await context.req.json();
    const validation = onboardingSchema.safeParse(body);

    if (!validation.success) {
      return jsonResponse(
        context,
        {
          error: validation.error.issues[0]?.message ?? "Invalid handle.",
        },
        400
      );
    }

    const existingOwner = await getProfilePageByHandle(validation.data.handle);

    if (existingOwner) {
      return jsonResponse(context, { error: "This handle is already taken." }, 409);
    }

    const createdPage = await createProfilePage({
      userId: session.user.id,
      values: validation.data,
    });

    return jsonResponse(
      context,
      {
        page: createdPage,
        success: true,
      },
      200
    );
  });

  return app;
};
