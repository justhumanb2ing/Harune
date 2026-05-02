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
  getOwnedProfilePage: (userId: string) => Promise<{ id: string } | null>;
  getProfileAnalyticsResponse: (input: {
    profilePageId: string | null;
    timezone?: string | null;
  }) => Promise<ProfileAnalyticsResponse>;
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
  getOwnedProfilePage,
  getProfileAnalyticsResponse,
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

  return app;
};
