import { Hono } from "hono";
import type { MeResponse } from "@/app/api/app/me/types";
import type { AuthSession } from "@/auth";
import { normalizeAnalyticsTimezone } from "@/lib/analytics/analytics-ranges";
import type { ProfileAnalyticsResponse } from "@/lib/analytics/types";
import { type ProfileUpdateValues, profileUpdateSchema } from "@/lib/validations/profile.schema";

type AuthenticatedSession = NonNullable<
  AuthSession & {
    user: {
      email: string;
      id: string;
    };
  }
>;

type AppApiDependencies = {
  auth: () => Promise<AuthSession | null>;
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
  logger?: Pick<Console, "error">;
  updateUserProfile: (input: {
    userId: string;
    values: ProfileUpdateValues;
  }) => Promise<MeResponse["user"] | null>;
};

const isAuthenticatedSession = (session: AuthSession | null): session is AuthenticatedSession => {
  return Boolean(session?.user?.id && session.user.email);
};

const jsonResponse = (body: unknown, status: number) => {
  return new Response(JSON.stringify(body), {
    headers: {
      "Content-Type": "application/json",
    },
    status,
  });
};

const unauthorizedResponse = () =>
  jsonResponse(
    {
      error: "Unauthorized",
      message: "You are not authorized to perform this action",
    },
    401
  );

export const createAppApi = ({
  auth: getSession,
  createS3UploadFields,
  getMissingS3ConfigKeys,
  getOwnedProfilePage,
  getProfileAnalyticsResponse,
  getPublicS3ObjectUrl,
  getMeForUser,
  logger = console,
  updateUserProfile,
}: AppApiDependencies) => {
  const app = new Hono();
  const getAuthenticatedSession = async () => {
    const session = await getSession();
    return isAuthenticatedSession(session) ? session : null;
  };

  app.get("/me", async () => {
    const session = await getAuthenticatedSession();

    if (!session) {
      return unauthorizedResponse();
    }

    return jsonResponse(await getMeForUser(session.user.id), 200);
  });

  app.patch("/me", async (context) => {
    const session = await getAuthenticatedSession();

    if (!session) {
      return unauthorizedResponse();
    }

    try {
      const body = await context.req.json();
      const validationResult = profileUpdateSchema.safeParse(body);

      if (!validationResult.success) {
        return jsonResponse(
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
        return jsonResponse({ error: "User not found" }, 404);
      }

      return jsonResponse(
        {
          message: "Profile updated successfully",
          user: updatedUser,
        },
        200
      );
    } catch (error) {
      logger.error("Error updating profile:", error);
      return jsonResponse({ error: "Failed to update profile" }, 500);
    }
  });

  app.get("/analytics", async (context) => {
    const session = await getAuthenticatedSession();

    if (!session) {
      return unauthorizedResponse();
    }

    try {
      const timezone = normalizeAnalyticsTimezone(context.req.header("x-vercel-ip-timezone"));
      const profilePage = await getOwnedProfilePage(session.user.id);
      const response = await getProfileAnalyticsResponse({
        profilePageId: profilePage?.id ?? null,
        timezone,
      });

      return jsonResponse(response, 200);
    } catch (error) {
      logger.error("Failed to load profile analytics:", error);
      return jsonResponse({ error: "Failed to load profile analytics." }, 500);
    }
  });

  app.post("/me/upload-avatar", async (context) => {
    const session = await getAuthenticatedSession();

    if (!session) {
      return unauthorizedResponse();
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
          { error: `S3 storage is not configured: ${missingConfigKeys.join(", ")}` },
          500
        );
      }

      if (!body.fileName || !body.fileType || !body.fileSize) {
        return jsonResponse(
          { error: "Missing required fields: fileName, fileType, fileSize" },
          400
        );
      }

      if (!body.fileType.startsWith("image/")) {
        return jsonResponse({ error: "Only image files are allowed for avatars" }, 400);
      }

      const maxSize = 5 * 1024 * 1024;

      if (body.fileSize > maxSize) {
        return jsonResponse({ error: "File size too large. Maximum allowed size is 5MB" }, 400);
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
        {
          fields: presignedPost.fields,
          publicUrl: getPublicS3ObjectUrl(s3Path),
          url: presignedPost.url,
        },
        200
      );
    } catch (error) {
      logger.error("Error creating presigned URL for avatar upload:", error);
      return jsonResponse({ error: "Failed to create upload URL" }, 500);
    }
  });

  app.post("/upload-input-images", async (context) => {
    const session = await getAuthenticatedSession();

    if (!session) {
      return unauthorizedResponse();
    }

    try {
      const body = (await context.req.json()) as {
        fileName?: string;
        fileSize?: number;
        fileType?: string;
      };

      if (!body.fileName || !body.fileType || !body.fileSize) {
        return jsonResponse(
          { error: "Missing required fields: fileName, fileType, fileSize" },
          400
        );
      }

      if (!body.fileType.startsWith("image/")) {
        return jsonResponse({ error: "Only image files are allowed" }, 400);
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
        {
          fields: presignedPost.fields,
          url: presignedPost.url,
        },
        200
      );
    } catch (error) {
      logger.error("Error creating presigned URL for image upload:", error);
      return jsonResponse({ error: "Failed to create upload URL" }, 500);
    }
  });

  return app;
};
