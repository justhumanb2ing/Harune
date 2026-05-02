import { Hono } from "hono";
import type { AuthSession } from "@/auth";
import { getProfileAppPath } from "@/lib/profile-page/app-paths";
import {
  getProfileImageFileError,
  getProfileImageKind,
  getProfileImageObjectKey,
  PROFILE_IMAGE_MAX_SIZE_BYTES,
  type ProfileImageKind,
  withProfileImageCacheVersion,
} from "@/lib/profile-page/image-upload";
import {
  getProfileBentoMediaFileError,
  getProfileBentoMediaType,
} from "@/lib/profile-page/media-upload";
import type { ProfileMediaType } from "@/lib/profile-page/types";
import { handleSchema } from "@/lib/validations/auth.schema";
import {
  type LinkItemInput,
  linkItemInputSchema,
  type ProfileBentoSyncValues,
  type ProfilePageSyncValues,
  type ProfilePageUpdateValues,
  profileBentoSyncSchema,
  profilePageSyncSchema,
  profilePageUpdateSchema,
  type ReorderItemsInput,
  reorderItemsSchema,
  type TextBoxItemInput,
  textBoxItemInputSchema,
} from "@/lib/validations/profile-page.schema";

type AuthenticatedSession = NonNullable<
  AuthSession & {
    user: {
      email: string;
      id: string;
    };
  }
>;

type ProfilePageApiDependencies = {
  auth: () => Promise<AuthSession | null>;
  createS3UploadFields: (input: {
    contentType?: string;
    maxSize?: number;
    path: string;
  }) => Promise<{ fields: Record<string, string>; url: string }>;
  createLinkItem: (input: { userId: string; values: LinkItemInput }) => Promise<unknown>;
  createTextBoxItem: (input: { userId: string; values: TextBoxItemInput }) => Promise<unknown>;
  deletePublicS3Object: (publicUrl: string) => Promise<unknown>;
  deleteLinkItem: (input: { linkId: string; userId: string }) => Promise<void>;
  deleteTextBoxItem: (input: { textBoxId: string; userId: string }) => Promise<void>;
  getProfileBentoMediaPublicUrl: (input: { contentHash: string; objectKey: string }) => string;
  getMissingS3ConfigKeys: () => string[];
  getProfilePageEditorData: (userId: string, handle?: string) => Promise<unknown | null>;
  getPublicS3ObjectUrl: (key: string) => string;
  getS3ObjectKeyFromPublicUrl: (publicUrl: string) => string | null;
  getTemporaryProfileBentoMediaObjectKey: (input: { bentoId: string; userId: string }) => string;
  hashProfileBentoMediaBuffer: (buffer: Buffer) => string;
  isHandleAvailableForUser: (input: { handle: string; userId: string }) => Promise<boolean>;
  isProfilePageError?: (error: unknown) => error is { message: string; status: number };
  logger?: Pick<Console, "error">;
  reorderLinkItems: (input: {
    orderedIds: ReorderItemsInput["orderedIds"];
    userId: string;
  }) => Promise<void>;
  putTemporaryProfileBentoMediaObject: (input: {
    body: Buffer;
    contentType: string;
    objectKey: string;
  }) => Promise<void>;
  reorderTextBoxItems: (input: {
    orderedIds: ReorderItemsInput["orderedIds"];
    userId: string;
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
  updateLinkItem: (input: {
    linkId: string;
    userId: string;
    values: LinkItemInput;
  }) => Promise<unknown>;
  updateProfileMetadata: (input: {
    userId: string;
    values: ProfilePageUpdateValues;
  }) => Promise<unknown>;
  updateTextBoxItem: (input: {
    textBoxId: string;
    userId: string;
    values: TextBoxItemInput;
  }) => Promise<unknown>;
};

const noStoreHeaders = {
  "Cache-Control": "no-store",
};

const isAuthenticatedSession = (session: AuthSession | null): session is AuthenticatedSession => {
  return Boolean(session?.user?.id && session.user.email);
};

const jsonResponse = (body: unknown, status: number) => {
  return new Response(JSON.stringify(body), {
    headers: {
      "Content-Type": "application/json",
      ...noStoreHeaders,
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

export const createProfilePageApi = ({
  auth: getSession,
  createS3UploadFields,
  createLinkItem,
  createTextBoxItem,
  deletePublicS3Object,
  deleteLinkItem,
  deleteTextBoxItem,
  getProfileBentoMediaPublicUrl,
  getMissingS3ConfigKeys,
  getProfilePageEditorData,
  getPublicS3ObjectUrl,
  getS3ObjectKeyFromPublicUrl,
  getTemporaryProfileBentoMediaObjectKey,
  hashProfileBentoMediaBuffer,
  isHandleAvailableForUser: checkHandleAvailability,
  isProfilePageError = (_error): _error is { message: string; status: number } => false,
  logger = console,
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
}: ProfilePageApiDependencies) => {
  const app = new Hono();
  const getAuthenticatedSession = async () => {
    const session = await getSession();
    return isAuthenticatedSession(session) ? session : null;
  };
  const routeErrorResponse = (error: unknown, logMessage: string, responseMessage: string) => {
    if (isProfilePageError(error)) {
      return jsonResponse({ error: error.message }, error.status);
    }

    logger.error(logMessage, error);
    return jsonResponse({ error: responseMessage }, 500);
  };
  const toValidationDescription = (issues: { message: string; path: PropertyKey[] }[]) =>
    issues
      .map((issue) => {
        const path = issue.path.join(".");
        return path ? `${path}: ${issue.message}` : issue.message;
      })
      .join("\n");

  app.get("/", async (context) => {
    const session = await getAuthenticatedSession();

    if (!session) {
      return unauthorizedResponse();
    }

    const data = await getProfilePageEditorData(session.user.id, context.req.query("handle"));

    if (!data) {
      return jsonResponse({ error: "Profile page not found." }, 404);
    }

    return jsonResponse(data, 200);
  });

  app.patch("/", async (context) => {
    const session = await getAuthenticatedSession();

    if (!session) {
      return unauthorizedResponse();
    }

    try {
      const body = await context.req.json();
      const validation = profilePageUpdateSchema.safeParse(body);

      if (!validation.success) {
        return jsonResponse(
          { error: validation.error.issues[0]?.message ?? "Invalid profile page payload." },
          400
        );
      }

      const page = await updateProfileMetadata({
        userId: session.user.id,
        values: validation.data,
      });

      return jsonResponse({ page }, 200);
    } catch (error) {
      return routeErrorResponse(
        error,
        "Failed to update profile page:",
        "Failed to update profile page."
      );
    }
  });

  app.get("/handle-availability", async (context) => {
    const session = await getAuthenticatedSession();

    if (!session) {
      return unauthorizedResponse();
    }

    try {
      const validation = handleSchema.safeParse(context.req.query("handle") ?? "");

      if (!validation.success) {
        return jsonResponse(
          { error: validation.error.issues[0]?.message ?? "Invalid handle." },
          400
        );
      }

      const available = await checkHandleAvailability({
        handle: validation.data,
        userId: session.user.id,
      });

      return jsonResponse({ available }, 200);
    } catch (error) {
      return routeErrorResponse(
        error,
        "Failed to check handle availability:",
        "Failed to check handle availability."
      );
    }
  });

  app.post("/sync", async (context) => {
    const session = await getAuthenticatedSession();

    if (!session) {
      return unauthorizedResponse();
    }

    try {
      const body = await context.req.json();
      const validation = profilePageSyncSchema.safeParse(body);

      if (!validation.success) {
        return jsonResponse({ error: "Failed to sync" }, 400);
      }

      const data = await syncProfilePageDraft({
        userId: session.user.id,
        values: validation.data,
      });

      revalidatePath(getProfileAppPath(data.page.handle));

      return jsonResponse(data, 200);
    } catch (error) {
      return routeErrorResponse(error, "Failed to sync:", "Failed to sync");
    }
  });

  app.post("/bento/sync", async (context) => {
    const session = await getAuthenticatedSession();

    if (!session) {
      return unauthorizedResponse();
    }

    try {
      const body = await context.req.json();
      const validation = profileBentoSyncSchema.safeParse(body);

      if (!validation.success) {
        return jsonResponse(
          {
            description: toValidationDescription(validation.error.issues),
            error: "Failed to sync bento",
          },
          400
        );
      }

      const data = await syncProfileBentoDraft({
        userId: session.user.id,
        values: validation.data,
      });

      revalidatePath(getProfileAppPath(data.page.handle));

      return jsonResponse(data, 200);
    } catch (error) {
      return routeErrorResponse(error, "Failed to sync bento:", "Failed to sync bento");
    }
  });

  app.post("/upload-image", async (context) => {
    const session = await getAuthenticatedSession();

    if (!session) {
      return unauthorizedResponse();
    }

    try {
      const body = (await context.req.json()) as {
        fileName?: string;
        fileSize?: number;
        fileType?: string;
        imageHash?: string;
        imageKind?: string;
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

      const imageError = getProfileImageFileError({
        size: body.fileSize,
        type: body.fileType,
      });

      if (imageError) {
        return jsonResponse({ error: imageError }, 400);
      }

      const profileImageKind = getProfileImageKind(body.imageKind);

      if (!profileImageKind) {
        return jsonResponse({ error: "Invalid profile image kind." }, 400);
      }

      if (!body.imageHash || !/^[a-f0-9]{64}$/i.test(body.imageHash)) {
        return jsonResponse({ error: "Invalid profile image hash." }, 400);
      }

      const s3Path = getProfileImageObjectKey(session.user.id, profileImageKind);
      const presignedPost = await createS3UploadFields({
        contentType: body.fileType,
        maxSize: PROFILE_IMAGE_MAX_SIZE_BYTES,
        path: s3Path,
      });
      const publicUrl = withProfileImageCacheVersion(getPublicS3ObjectUrl(s3Path), body.imageHash);

      return jsonResponse(
        {
          fields: presignedPost.fields,
          publicUrl,
          url: presignedPost.url,
        },
        200
      );
    } catch (error) {
      logger.error("Error creating presigned URL for profile image upload:", error);
      return jsonResponse({ error: "Failed to create upload URL" }, 500);
    }
  });

  app.patch("/upload-image", async (context) => {
    const session = await getAuthenticatedSession();

    if (!session) {
      return unauthorizedResponse();
    }

    try {
      const body = (await context.req.json()) as {
        imageKind?: string;
        imageUrl?: string;
      };
      const profileImageKind = getProfileImageKind(body.imageKind);

      if (!profileImageKind || !body.imageUrl) {
        return jsonResponse({ error: "Invalid profile image payload." }, 400);
      }

      const objectKey = getS3ObjectKeyFromPublicUrl(body.imageUrl);
      const expectedKey = getProfileImageObjectKey(session.user.id, profileImageKind);

      if (objectKey !== expectedKey) {
        return jsonResponse({ error: "Invalid profile image URL." }, 400);
      }

      const updatedPage = await updateProfileImage({
        imageKind: profileImageKind,
        imageUrl: body.imageUrl,
        userId: session.user.id,
      });

      if (!updatedPage) {
        return jsonResponse({ error: "Profile page not found." }, 404);
      }

      return jsonResponse(
        {
          imageUrl:
            profileImageKind === "background" ? updatedPage.backgroundImage : updatedPage.image,
        },
        200
      );
    } catch (error) {
      logger.error("Error finalizing profile image upload:", error);
      return jsonResponse({ error: "Failed to finalize profile image upload" }, 500);
    }
  });

  app.delete("/upload-image", async (context) => {
    const session = await getAuthenticatedSession();

    if (!session) {
      return unauthorizedResponse();
    }

    try {
      const body = (await context.req.json()) as {
        imageUrl?: string;
      };

      if (!body.imageUrl) {
        return jsonResponse({ error: "Missing required field: imageUrl" }, 400);
      }

      const objectKey = getS3ObjectKeyFromPublicUrl(body.imageUrl);
      const expectedPrefix = `public/users/${session.user.id}/profile-page/`;

      if (!objectKey?.startsWith(expectedPrefix)) {
        return jsonResponse({ error: "Invalid profile image URL." }, 400);
      }

      await deletePublicS3Object(body.imageUrl);

      return jsonResponse({ success: true }, 200);
    } catch (error) {
      logger.error("Error deleting profile image:", error);
      return jsonResponse({ error: "Failed to delete profile image" }, 500);
    }
  });

  app.post("/bento/media/upload", async (context) => {
    const session = await getAuthenticatedSession();

    if (!session) {
      return unauthorizedResponse();
    }

    try {
      const formData = await context.req.formData();
      const file = formData.get("file");
      const bentoId = formData.get("bentoId");

      if (!(file instanceof File) || typeof bentoId !== "string" || bentoId.trim().length === 0) {
        return jsonResponse({ error: "Missing required media upload fields." }, 400);
      }

      const fileError = getProfileBentoMediaFileError(file);

      if (fileError) {
        return jsonResponse({ error: fileError }, 400);
      }

      const mediaType = getProfileBentoMediaType(file.type);

      if (!mediaType) {
        return jsonResponse({ error: "Unsupported media type." }, 400);
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const contentHash = hashProfileBentoMediaBuffer(buffer);
      const tempObjectKey = getTemporaryProfileBentoMediaObjectKey({
        bentoId,
        userId: session.user.id,
      });

      await putTemporaryProfileBentoMediaObject({
        body: buffer,
        contentType: file.type,
        objectKey: tempObjectKey,
      });

      return jsonResponse(
        {
          contentHash,
          contentType: file.type,
          mediaType: mediaType satisfies ProfileMediaType,
          tempObjectKey,
          tempUrl: getProfileBentoMediaPublicUrl({
            contentHash,
            objectKey: tempObjectKey,
          }),
        },
        200
      );
    } catch (error) {
      logger.error("Failed to upload bento media:", error);
      return jsonResponse({ error: "Failed to upload media." }, 500);
    }
  });

  app.post("/links", async (context) => {
    const session = await getAuthenticatedSession();

    if (!session) {
      return unauthorizedResponse();
    }

    try {
      const body = await context.req.json();
      const validation = linkItemInputSchema.safeParse(body);

      if (!validation.success) {
        return jsonResponse(
          { error: validation.error.issues[0]?.message ?? "Invalid link item payload." },
          400
        );
      }

      const linkItem = await createLinkItem({
        userId: session.user.id,
        values: validation.data,
      });

      return jsonResponse({ linkItem }, 200);
    } catch (error) {
      return routeErrorResponse(
        error,
        "Failed to create link item:",
        "Failed to create link item."
      );
    }
  });

  app.post("/links/reorder", async (context) => {
    const session = await getAuthenticatedSession();

    if (!session) {
      return unauthorizedResponse();
    }

    try {
      const body = await context.req.json();
      const validation = reorderItemsSchema.safeParse(body);

      if (!validation.success) {
        return jsonResponse(
          { error: validation.error.issues[0]?.message ?? "Invalid reorder payload." },
          400
        );
      }

      await reorderLinkItems({
        orderedIds: validation.data.orderedIds,
        userId: session.user.id,
      });

      return jsonResponse({ success: true }, 200);
    } catch (error) {
      return routeErrorResponse(
        error,
        "Failed to reorder link items:",
        "Failed to reorder link items."
      );
    }
  });

  app.patch("/links/:linkId", async (context) => {
    const session = await getAuthenticatedSession();

    if (!session) {
      return unauthorizedResponse();
    }

    try {
      const body = await context.req.json();
      const validation = linkItemInputSchema.safeParse(body);

      if (!validation.success) {
        return jsonResponse(
          { error: validation.error.issues[0]?.message ?? "Invalid link item payload." },
          400
        );
      }

      const linkItem = await updateLinkItem({
        linkId: context.req.param("linkId"),
        userId: session.user.id,
        values: validation.data,
      });

      return jsonResponse({ linkItem }, 200);
    } catch (error) {
      return routeErrorResponse(
        error,
        "Failed to update link item:",
        "Failed to update link item."
      );
    }
  });

  app.delete("/links/:linkId", async (context) => {
    const session = await getAuthenticatedSession();

    if (!session) {
      return unauthorizedResponse();
    }

    try {
      await deleteLinkItem({
        linkId: context.req.param("linkId"),
        userId: session.user.id,
      });

      return jsonResponse({ success: true }, 200);
    } catch (error) {
      return routeErrorResponse(
        error,
        "Failed to delete link item:",
        "Failed to delete link item."
      );
    }
  });

  app.post("/text", async (context) => {
    const session = await getAuthenticatedSession();

    if (!session) {
      return unauthorizedResponse();
    }

    try {
      const body = await context.req.json();
      const validation = textBoxItemInputSchema.safeParse(body);

      if (!validation.success) {
        return jsonResponse(
          { error: validation.error.issues[0]?.message ?? "Invalid text box payload." },
          400
        );
      }

      const textBoxItem = await createTextBoxItem({
        userId: session.user.id,
        values: validation.data,
      });

      return jsonResponse({ textBoxItem }, 200);
    } catch (error) {
      return routeErrorResponse(
        error,
        "Failed to create text box item:",
        "Failed to create text box item."
      );
    }
  });

  app.post("/text/reorder", async (context) => {
    const session = await getAuthenticatedSession();

    if (!session) {
      return unauthorizedResponse();
    }

    try {
      const body = await context.req.json();
      const validation = reorderItemsSchema.safeParse(body);

      if (!validation.success) {
        return jsonResponse(
          { error: validation.error.issues[0]?.message ?? "Invalid reorder payload." },
          400
        );
      }

      await reorderTextBoxItems({
        orderedIds: validation.data.orderedIds,
        userId: session.user.id,
      });

      return jsonResponse({ success: true }, 200);
    } catch (error) {
      return routeErrorResponse(
        error,
        "Failed to reorder text box items:",
        "Failed to reorder text box items."
      );
    }
  });

  app.patch("/text/:textBoxId", async (context) => {
    const session = await getAuthenticatedSession();

    if (!session) {
      return unauthorizedResponse();
    }

    try {
      const body = await context.req.json();
      const validation = textBoxItemInputSchema.safeParse(body);

      if (!validation.success) {
        return jsonResponse(
          { error: validation.error.issues[0]?.message ?? "Invalid text box payload." },
          400
        );
      }

      const textBoxItem = await updateTextBoxItem({
        textBoxId: context.req.param("textBoxId"),
        userId: session.user.id,
        values: validation.data,
      });

      return jsonResponse({ textBoxItem }, 200);
    } catch (error) {
      return routeErrorResponse(
        error,
        "Failed to update text box item:",
        "Failed to update text box item."
      );
    }
  });

  app.delete("/text/:textBoxId", async (context) => {
    const session = await getAuthenticatedSession();

    if (!session) {
      return unauthorizedResponse();
    }

    try {
      await deleteTextBoxItem({
        textBoxId: context.req.param("textBoxId"),
        userId: session.user.id,
      });

      return jsonResponse({ success: true }, 200);
    } catch (error) {
      return routeErrorResponse(
        error,
        "Failed to delete text box item:",
        "Failed to delete text box item."
      );
    }
  });

  return app;
};
