import type { AuthSession } from "@/auth";
import {
  apiFactory,
  createSessionMiddleware,
  getAuthenticatedSession,
  jsonResponse,
  unauthorizedResponse,
} from "@/lib/api/hono-factory";
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
import { handleSchema } from "@/lib/validations/auth.schema";
import {
  type ProfileBentoSyncValues,
  type ProfilePageSyncValues,
  type ProfilePageUpdateValues,
  profileBentoSyncSchema,
  profilePageSyncSchema,
  profilePageUpdateSchema,
} from "@/lib/validations/profile-content.schema";

type ProfileApiDependencies = {
  auth: () => Promise<AuthSession | null>;
  deleteProfileMediaObject: (objectKey: string) => Promise<unknown>;
  getProfileMediaPublicUrl: (input: { contentHash: string; objectKey: string }) => string;
  getProfileMediaObjectKeyFromUrl: (publicUrl: string) => string | null;
  getProfilePageEditorData: (userId: string, handle?: string) => Promise<unknown | null>;
  getTemporaryProfileBentoMediaObjectKey: (input: { bentoId: string; userId: string }) => string;
  hashProfileMediaBuffer: (buffer: Buffer) => string;
  isHandleAvailableForUser: (input: { handle: string; userId: string }) => Promise<boolean>;
  isProfilePageError?: (error: unknown) => error is { message: string; status: number };
  logger?: Pick<Console, "error">;
  putProfileMediaObject: (input: {
    body: Buffer;
    contentType: string;
    objectKey: string;
  }) => Promise<void>;
  revalidatePath: (path: string) => void;
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

export const createProfileApi = ({
  auth: getSession,
  deleteProfileMediaObject,
  getProfileMediaPublicUrl,
  getProfileMediaObjectKeyFromUrl,
  getProfilePageEditorData,
  getTemporaryProfileBentoMediaObjectKey,
  hashProfileMediaBuffer,
  isHandleAvailableForUser: checkHandleAvailability,
  isProfilePageError = (_error): _error is { message: string; status: number } => false,
  logger = console,
  putProfileMediaObject,
  revalidatePath,
  syncProfileBentoDraft,
  syncProfilePageDraft,
  updateProfileImage,
  updateProfileMetadata,
}: ProfileApiDependencies) => {
  const app = apiFactory.createApp();

  app.use("*", createSessionMiddleware(getSession));
  const routeErrorResponse = (
    context: Parameters<typeof jsonResponse>[0],
    error: unknown,
    logMessage: string,
    responseMessage: string
  ) => {
    if (isProfilePageError(error)) {
      return jsonResponse(
        context,
        { error: error.message },
        { noStore: true, status: error.status }
      );
    }

    logger.error(logMessage, error);
    return jsonResponse(context, { error: responseMessage }, { noStore: true, status: 500 });
  };
  app.get("/", async (context) => {
    const session = getAuthenticatedSession(context);

    if (!session) {
      return unauthorizedResponse(context, { noStore: true });
    }

    const data = await getProfilePageEditorData(session.user.id, context.req.query("handle"));

    if (!data) {
      return jsonResponse(
        context,
        { error: "Profile page not found." },
        { noStore: true, status: 404 }
      );
    }

    return jsonResponse(context, data, { noStore: true, status: 200 });
  });
  app.patch("/", async (context) => {
    const session = getAuthenticatedSession(context);

    if (!session) {
      return unauthorizedResponse(context, { noStore: true });
    }

    try {
      const body = await context.req.json();
      const validation = profilePageUpdateSchema.safeParse(body);

      if (!validation.success) {
        return jsonResponse(
          context,
          { error: validation.error.issues[0]?.message ?? "Invalid profile page payload." },
          400
        );
      }

      const page = await updateProfileMetadata({
        userId: session.user.id,
        values: validation.data,
      });

      return jsonResponse(context, { page }, { noStore: true, status: 200 });
    } catch (error) {
      return routeErrorResponse(
        context,
        error,
        "Failed to update profile page:",
        "Failed to update profile page."
      );
    }
  });
  app.get("/handle-availability", async (context) => {
    const session = getAuthenticatedSession(context);

    if (!session) {
      return unauthorizedResponse(context, { noStore: true });
    }

    try {
      const validation = handleSchema.safeParse(context.req.query("handle") ?? "");

      if (!validation.success) {
        return jsonResponse(
          context,
          { error: validation.error.issues[0]?.message ?? "Invalid handle." },
          400
        );
      }

      const available = await checkHandleAvailability({
        handle: validation.data,
        userId: session.user.id,
      });

      return jsonResponse(context, { available }, { noStore: true, status: 200 });
    } catch (error) {
      return routeErrorResponse(
        context,
        error,
        "Failed to check handle availability:",
        "Failed to check handle availability."
      );
    }
  });
  app.post("/sync", async (context) => {
    const session = getAuthenticatedSession(context);

    if (!session) {
      return unauthorizedResponse(context, { noStore: true });
    }

    try {
      const body = await context.req.json();
      const validation = profilePageSyncSchema.safeParse(body);

      if (!validation.success) {
        return jsonResponse(context, { error: "Failed to sync" }, { noStore: true, status: 400 });
      }

      const data = await syncProfilePageDraft({
        userId: session.user.id,
        values: validation.data,
      });

      revalidatePath(getProfileAppPath(data.page.handle));

      return jsonResponse(context, data, { noStore: true, status: 200 });
    } catch (error) {
      return routeErrorResponse(context, error, "Failed to sync:", "Failed to sync");
    }
  });
  app.post("/bento/sync", async (context) => {
    const session = getAuthenticatedSession(context);

    if (!session) {
      return unauthorizedResponse(context, { noStore: true });
    }

    try {
      const body = await context.req.json();
      const validation = profileBentoSyncSchema.safeParse(body);

      if (!validation.success) {
        return jsonResponse(
          context,
          {
            error: "Failed to sync bento",
          },
          { noStore: true, status: 400 }
        );
      }

      const data = await syncProfileBentoDraft({
        userId: session.user.id,
        values: validation.data,
      });

      revalidatePath(getProfileAppPath(data.page.handle));

      return jsonResponse(context, data, { noStore: true, status: 200 });
    } catch (error) {
      return routeErrorResponse(context, error, "Failed to sync bento:", "Failed to sync bento");
    }
  });
  app.post("/upload-image", async (context) => {
    const session = getAuthenticatedSession(context);

    if (!session) {
      return unauthorizedResponse(context, { noStore: true });
    }

    try {
      const formData = await context.req.formData();
      const file = formData.get("file");
      const imageKind = formData.get("imageKind");
      const imageHash = formData.get("imageHash");

      if (!(file instanceof File) || typeof imageKind !== "string") {
        return jsonResponse(
          context,
          { error: "Missing required profile image upload fields." },
          { noStore: true, status: 400 }
        );
      }

      const imageError = getProfileImageFileError(file);

      if (imageError) {
        return jsonResponse(context, { error: imageError }, { noStore: true, status: 400 });
      }

      const profileImageKind = getProfileImageKind(imageKind);

      if (!profileImageKind) {
        return jsonResponse(
          context,
          { error: "Invalid profile image kind." },
          { noStore: true, status: 400 }
        );
      }

      if (typeof imageHash !== "string" || !/^[a-f0-9]{64}$/i.test(imageHash)) {
        return jsonResponse(
          context,
          { error: "Invalid profile image hash." },
          { noStore: true, status: 400 }
        );
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const contentHash = hashProfileMediaBuffer(buffer);

      if (contentHash !== imageHash.toLowerCase()) {
        return jsonResponse(
          context,
          { error: "Profile image hash mismatch." },
          { noStore: true, status: 400 }
        );
      }

      const objectKey = getProfileImageObjectKey(session.user.id, profileImageKind);

      await putProfileMediaObject({
        body: buffer,
        contentType: file.type,
        objectKey,
      });

      return jsonResponse(
        context,
        {
          imageUrl: getProfileMediaPublicUrl({
            contentHash,
            objectKey,
          }),
        },
        { noStore: true, status: 200 }
      );
    } catch (error) {
      logger.error("Error uploading profile image to R2:", error);
      return jsonResponse(
        context,
        { error: "Failed to upload profile image" },
        { noStore: true, status: 500 }
      );
    }
  });
  app.patch("/upload-image", async (context) => {
    const session = getAuthenticatedSession(context);

    if (!session) {
      return unauthorizedResponse(context, { noStore: true });
    }

    try {
      const body = (await context.req.json()) as {
        imageKind?: string;
        imageUrl?: string;
      };
      const profileImageKind = getProfileImageKind(body.imageKind);

      if (!profileImageKind || !body.imageUrl) {
        return jsonResponse(
          context,
          { error: "Invalid profile image payload." },
          { noStore: true, status: 400 }
        );
      }

      const objectKey = getProfileMediaObjectKeyFromUrl(body.imageUrl);
      const expectedKey = getProfileImageObjectKey(session.user.id, profileImageKind);

      if (objectKey !== expectedKey) {
        return jsonResponse(
          context,
          { error: "Invalid profile image URL." },
          { noStore: true, status: 400 }
        );
      }

      const updatedPage = await updateProfileImage({
        imageKind: profileImageKind,
        imageUrl: body.imageUrl,
        userId: session.user.id,
      });

      if (!updatedPage) {
        return jsonResponse(
          context,
          { error: "Profile page not found." },
          { noStore: true, status: 404 }
        );
      }

      return jsonResponse(
        context,
        {
          imageUrl:
            profileImageKind === "background" ? updatedPage.backgroundImage : updatedPage.image,
        },
        200
      );
    } catch (error) {
      logger.error("Error finalizing profile image upload:", error);
      return jsonResponse(
        context,
        { error: "Failed to finalize profile image upload" },
        { noStore: true, status: 500 }
      );
    }
  });
  app.delete("/upload-image", async (context) => {
    const session = getAuthenticatedSession(context);

    if (!session) {
      return unauthorizedResponse(context, { noStore: true });
    }

    try {
      const body = (await context.req.json()) as {
        imageUrl?: string;
      };

      if (!body.imageUrl) {
        return jsonResponse(
          context,
          { error: "Missing required field: imageUrl" },
          { noStore: true, status: 400 }
        );
      }

      const objectKey = getProfileMediaObjectKeyFromUrl(body.imageUrl);
      const expectedPrefix = `public/users/${session.user.id}/profile/`;

      if (!objectKey?.startsWith(expectedPrefix)) {
        return jsonResponse(
          context,
          { error: "Invalid profile image URL." },
          { noStore: true, status: 400 }
        );
      }

      await deleteProfileMediaObject(objectKey);

      return jsonResponse(context, { success: true }, { noStore: true, status: 200 });
    } catch (error) {
      logger.error("Error deleting profile image:", error);
      return jsonResponse(
        context,
        { error: "Failed to delete profile image" },
        { noStore: true, status: 500 }
      );
    }
  });
  app.post("/bento/media/upload", async (context) => {
    const session = getAuthenticatedSession(context);

    if (!session) {
      return unauthorizedResponse(context, { noStore: true });
    }

    try {
      const formData = await context.req.formData();
      const file = formData.get("file");
      const bentoId = formData.get("bentoId");

      if (!(file instanceof File) || typeof bentoId !== "string" || bentoId.trim().length === 0) {
        return jsonResponse(
          context,
          { error: "Missing required media upload fields." },
          { noStore: true, status: 400 }
        );
      }

      const fileError = getProfileBentoMediaFileError(file);

      if (fileError) {
        return jsonResponse(context, { error: fileError }, { noStore: true, status: 400 });
      }

      const mediaType = getProfileBentoMediaType(file.type);

      if (!mediaType) {
        return jsonResponse(
          context,
          { error: "Unsupported media type." },
          { noStore: true, status: 400 }
        );
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const contentHash = hashProfileMediaBuffer(buffer);
      const tempObjectKey = getTemporaryProfileBentoMediaObjectKey({
        bentoId,
        userId: session.user.id,
      });

      await putProfileMediaObject({
        body: buffer,
        contentType: file.type,
        objectKey: tempObjectKey,
      });

      return jsonResponse(
        context,
        {
          contentHash,
          contentType: file.type,
          mediaType: mediaType satisfies ProfileMediaType,
          tempObjectKey,
          tempUrl: getProfileMediaPublicUrl({
            contentHash,
            objectKey: tempObjectKey,
          }),
        },
        { noStore: true, status: 200 }
      );
    } catch (error) {
      logger.error("Failed to upload bento media:", error);
      return jsonResponse(
        context,
        { error: "Failed to upload media." },
        { noStore: true, status: 500 }
      );
    }
  });
  return app;
};
