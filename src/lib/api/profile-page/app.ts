import { Hono } from "hono";
import type { AuthSession } from "@/auth";
import { handleSchema } from "@/lib/validations/auth.schema";
import { type LinkItemInput, linkItemInputSchema } from "@/lib/validations/profile-page.schema";

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
  createLinkItem: (input: { userId: string; values: LinkItemInput }) => Promise<unknown>;
  deleteLinkItem: (input: { linkId: string; userId: string }) => Promise<void>;
  isHandleAvailableForUser: (input: { handle: string; userId: string }) => Promise<boolean>;
  isProfilePageError?: (error: unknown) => error is { message: string; status: number };
  logger?: Pick<Console, "error">;
  updateLinkItem: (input: {
    linkId: string;
    userId: string;
    values: LinkItemInput;
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
  createLinkItem,
  deleteLinkItem,
  isHandleAvailableForUser: checkHandleAvailability,
  isProfilePageError = (_error): _error is { message: string; status: number } => false,
  logger = console,
  updateLinkItem,
}: ProfilePageApiDependencies) => {
  const app = new Hono();

  app.get("/handle-availability", async (context) => {
    const session = await getSession();

    if (!isAuthenticatedSession(session)) {
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
      if (isProfilePageError(error)) {
        return jsonResponse({ error: error.message }, error.status);
      }

      logger.error("Failed to check handle availability:", error);
      return jsonResponse({ error: "Failed to check handle availability." }, 500);
    }
  });

  app.post("/links", async (context) => {
    const session = await getSession();

    if (!isAuthenticatedSession(session)) {
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
      if (isProfilePageError(error)) {
        return jsonResponse({ error: error.message }, error.status);
      }

      logger.error("Failed to create link item:", error);
      return jsonResponse({ error: "Failed to create link item." }, 500);
    }
  });

  app.patch("/links/:linkId", async (context) => {
    const session = await getSession();

    if (!isAuthenticatedSession(session)) {
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
      if (isProfilePageError(error)) {
        return jsonResponse({ error: error.message }, error.status);
      }

      logger.error("Failed to update link item:", error);
      return jsonResponse({ error: "Failed to update link item." }, 500);
    }
  });

  app.delete("/links/:linkId", async (context) => {
    const session = await getSession();

    if (!isAuthenticatedSession(session)) {
      return unauthorizedResponse();
    }

    try {
      await deleteLinkItem({
        linkId: context.req.param("linkId"),
        userId: session.user.id,
      });

      return jsonResponse({ success: true }, 200);
    } catch (error) {
      if (isProfilePageError(error)) {
        return jsonResponse({ error: error.message }, error.status);
      }

      logger.error("Failed to delete link item:", error);
      return jsonResponse({ error: "Failed to delete link item." }, 500);
    }
  });

  return app;
};
