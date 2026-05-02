import { Hono } from "hono";
import type { MeResponse } from "@/app/api/app/me/types";
import type { AuthSession } from "@/auth";
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

  return app;
};
