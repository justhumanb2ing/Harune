import type { AuthSession } from "@/auth";
import { apiFactory, jsonResponse, unauthorizedResponse } from "@/lib/api/hono-factory";
import { createSessionMiddleware, getAuthenticatedSession } from "@/lib/api/middlewares/session";
import {
  profileBentoSyncJsonSchema,
  profileHandleAvailabilityQuerySchema,
  profileImageDeleteJsonSchema,
  profileImageFinalizeJsonSchema,
  profilePageSyncJsonSchema,
  profilePageUpdateJsonSchema,
} from "@/lib/api/schemas/profile";
import {
  createProfileApiServices,
  type ProfileApiServiceDependencies,
} from "@/lib/api/services/profile";

type ProfileApiDependencies = ProfileApiServiceDependencies & {
  auth: () => Promise<AuthSession | null>;
  logger?: Pick<Console, "error">;
};

export const createProfileApi = ({
  auth: getSession,
  logger = console,
  ...deps
}: ProfileApiDependencies) => {
  const app = apiFactory.createApp();
  const services = createProfileApiServices(deps);

  const routeErrorResponse = (
    context: Parameters<typeof jsonResponse>[0],
    error: unknown,
    logMessage: string,
    responseMessage: string
  ) => {
    const profileError = services.getProfileError(error);

    if (profileError) {
      return jsonResponse(
        context,
        { error: profileError.error },
        { noStore: true, status: profileError.status }
      );
    }

    logger.error(logMessage, error);
    return jsonResponse(context, { error: responseMessage }, { noStore: true, status: 500 });
  };

  app.use("*", createSessionMiddleware(getSession));
  app.get("/", async (context) => {
    const session = getAuthenticatedSession(context);

    if (!session) {
      return unauthorizedResponse(context, { noStore: true });
    }

    const data = await services.getEditorData({
      handle: context.req.query("handle"),
      userId: session.user.id,
    });

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
      const validation = profilePageUpdateJsonSchema.safeParse(await context.req.json());

      if (!validation.success) {
        return jsonResponse(
          context,
          { error: validation.error.issues[0]?.message ?? "Invalid profile page payload." },
          400
        );
      }

      const page = await services.updateMetadata({
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
      const validation = profileHandleAvailabilityQuerySchema.safeParse({
        handle: context.req.query("handle") ?? "",
      });

      if (!validation.success) {
        return jsonResponse(
          context,
          { error: validation.error.issues[0]?.message ?? "Invalid handle." },
          400
        );
      }

      return jsonResponse(
        context,
        await services.isHandleAvailable({
          handle: validation.data.handle,
          userId: session.user.id,
        }),
        { noStore: true, status: 200 }
      );
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
      const validation = profilePageSyncJsonSchema.safeParse(await context.req.json());

      if (!validation.success) {
        return jsonResponse(context, { error: "Failed to sync" }, { noStore: true, status: 400 });
      }

      const data = await services.syncPage({
        userId: session.user.id,
        values: validation.data,
      });

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
      const validation = profileBentoSyncJsonSchema.safeParse(await context.req.json());

      if (!validation.success) {
        return jsonResponse(
          context,
          {
            error: "Failed to sync bento",
          },
          { noStore: true, status: 400 }
        );
      }

      const data = await services.syncBento({
        userId: session.user.id,
        values: validation.data,
      });

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
      const result = await services.uploadProfileImage({
        file: formData.get("file"),
        imageHash: formData.get("imageHash"),
        imageKind: formData.get("imageKind"),
        userId: session.user.id,
      });

      if ("error" in result) {
        return jsonResponse(
          context,
          { error: result.error },
          { noStore: true, status: result.status }
        );
      }

      return jsonResponse(context, result, { noStore: true, status: 200 });
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
      const validation = profileImageFinalizeJsonSchema.safeParse(await context.req.json());

      if (!validation.success) {
        return jsonResponse(
          context,
          { error: "Invalid profile image payload." },
          { noStore: true, status: 400 }
        );
      }

      const result = await services.finalizeProfileImage({
        imageKind: validation.data.imageKind,
        imageUrl: validation.data.imageUrl,
        userId: session.user.id,
      });

      if ("error" in result) {
        return jsonResponse(
          context,
          { error: result.error },
          { noStore: true, status: result.status }
        );
      }

      return jsonResponse(context, result, 200);
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
      const validation = profileImageDeleteJsonSchema.safeParse(await context.req.json());

      if (!validation.success) {
        return jsonResponse(
          context,
          { error: "Missing required field: imageUrl" },
          { noStore: true, status: 400 }
        );
      }

      const result = await services.deleteProfileImage({
        imageUrl: validation.data.imageUrl,
        userId: session.user.id,
      });

      if ("error" in result) {
        return jsonResponse(
          context,
          { error: result.error },
          { noStore: true, status: result.status }
        );
      }

      return jsonResponse(context, result, { noStore: true, status: 200 });
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
      const result = await services.uploadBentoMedia({
        bentoId: formData.get("bentoId"),
        file: formData.get("file"),
        userId: session.user.id,
      });

      if ("error" in result) {
        return jsonResponse(
          context,
          { error: result.error },
          { noStore: true, status: result.status }
        );
      }

      return jsonResponse(context, result, { noStore: true, status: 200 });
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
