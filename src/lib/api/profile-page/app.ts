import { Hono } from "hono";
import type { AuthSession } from "@/auth";
import { handleSchema } from "@/lib/validations/auth.schema";

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
  isHandleAvailableForUser: (input: { handle: string; userId: string }) => Promise<boolean>;
  isProfilePageError?: (error: unknown) => error is { message: string; status: number };
  logger?: Pick<Console, "error">;
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

export const createProfilePageApi = ({
  auth: getSession,
  isHandleAvailableForUser: checkHandleAvailability,
  isProfilePageError = (_error): _error is { message: string; status: number } => false,
  logger = console,
}: ProfilePageApiDependencies) => {
  const app = new Hono();

  app.get("/handle-availability", async (context) => {
    const session = await getSession();

    if (!isAuthenticatedSession(session)) {
      return context.json(
        {
          error: "Unauthorized",
          message: "You are not authorized to perform this action",
        },
        401,
        noStoreHeaders
      );
    }

    try {
      const validation = handleSchema.safeParse(context.req.query("handle") ?? "");

      if (!validation.success) {
        return context.json(
          { error: validation.error.issues[0]?.message ?? "Invalid handle." },
          400,
          noStoreHeaders
        );
      }

      const available = await checkHandleAvailability({
        handle: validation.data,
        userId: session.user.id,
      });

      return context.json({ available }, 200, noStoreHeaders);
    } catch (error) {
      if (isProfilePageError(error)) {
        return jsonResponse({ error: error.message }, error.status);
      }

      logger.error("Failed to check handle availability:", error);
      return context.json({ error: "Failed to check handle availability." }, 500, noStoreHeaders);
    }
  });

  return app;
};
