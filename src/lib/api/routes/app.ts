import type { AuthSession } from "@/auth";
import { apiFactory, jsonResponse, unauthorizedResponse } from "@/lib/api/hono-factory";
import { createSessionMiddleware, getAuthenticatedSession } from "@/lib/api/middlewares/session";
import {
  appOnboardingJsonSchema,
  appProfileUpdateJsonSchema,
  appUploadImageJsonSchema,
} from "@/lib/api/schemas/app";
import { type AppApiServiceDependencies, createAppApiServices } from "@/lib/api/services/app";

type AppApiDependencies = AppApiServiceDependencies & {
  auth: () => Promise<AuthSession | null>;
  logger?: Pick<Console, "error">;
};

export const createAppApi = ({
  auth: getSession,
  logger = console,
  ...deps
}: AppApiDependencies) => {
  const app = apiFactory.createApp();
  const services = createAppApiServices(deps);

  app.use("*", createSessionMiddleware(getSession));
  app.get("/me", async (context) => {
    const session = getAuthenticatedSession(context);

    if (!session) {
      return unauthorizedResponse(context);
    }

    return jsonResponse(context, await services.getMe(session.user.id), 200);
  });
  app.patch("/me", async (context) => {
    const session = getAuthenticatedSession(context);

    if (!session) {
      return unauthorizedResponse(context);
    }

    try {
      const body = await context.req.json();
      const validationResult = appProfileUpdateJsonSchema.safeParse(body);

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

      const updatedUser = await services.updateMe({
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
  app.post("/me/upload-avatar", async (context) => {
    const session = getAuthenticatedSession(context);

    if (!session) {
      return unauthorizedResponse(context);
    }

    try {
      const validation = appUploadImageJsonSchema.safeParse(await context.req.json());

      if (!validation.success) {
        return jsonResponse(
          context,
          { error: "Missing required fields: fileName, fileType, fileSize" },
          400
        );
      }

      const result = await services.createAvatarUpload({
        body: validation.data,
        userId: session.user.id,
      });

      if ("error" in result) {
        return jsonResponse(context, { error: result.error }, result.status);
      }

      return jsonResponse(context, result, 200);
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
      const validation = appUploadImageJsonSchema.safeParse(await context.req.json());

      if (!validation.success) {
        return jsonResponse(
          context,
          { error: "Missing required fields: fileName, fileType, fileSize" },
          400
        );
      }

      const result = await services.createInputImageUpload({
        body: validation.data,
        userId: session.user.id,
      });

      if ("error" in result) {
        return jsonResponse(context, { error: result.error }, result.status);
      }

      return jsonResponse(context, result, 200);
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

    const validation = appOnboardingJsonSchema.safeParse(await context.req.json());

    if (!validation.success) {
      return jsonResponse(
        context,
        {
          error: validation.error.issues[0]?.message ?? "Invalid handle.",
        },
        400
      );
    }

    const result = await services.createProfile({
      userId: session.user.id,
      values: validation.data,
    });

    if ("error" in result) {
      return jsonResponse(context, { error: result.error }, result.status);
    }

    return jsonResponse(context, result, 200);
  });

  return app;
};
