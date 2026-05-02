import { Hono } from "hono";
import type { AuthSession } from "@/auth";
import { handleSchema } from "@/lib/validations/auth.schema";
import {
  type LinkItemInput,
  linkItemInputSchema,
  type ProfilePageUpdateValues,
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
  createLinkItem: (input: { userId: string; values: LinkItemInput }) => Promise<unknown>;
  createTextBoxItem: (input: { userId: string; values: TextBoxItemInput }) => Promise<unknown>;
  deleteLinkItem: (input: { linkId: string; userId: string }) => Promise<void>;
  deleteTextBoxItem: (input: { textBoxId: string; userId: string }) => Promise<void>;
  getProfilePageEditorData: (userId: string, handle?: string) => Promise<unknown | null>;
  isHandleAvailableForUser: (input: { handle: string; userId: string }) => Promise<boolean>;
  isProfilePageError?: (error: unknown) => error is { message: string; status: number };
  logger?: Pick<Console, "error">;
  reorderLinkItems: (input: {
    orderedIds: ReorderItemsInput["orderedIds"];
    userId: string;
  }) => Promise<void>;
  reorderTextBoxItems: (input: {
    orderedIds: ReorderItemsInput["orderedIds"];
    userId: string;
  }) => Promise<void>;
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
  createLinkItem,
  createTextBoxItem,
  deleteLinkItem,
  deleteTextBoxItem,
  getProfilePageEditorData,
  isHandleAvailableForUser: checkHandleAvailability,
  isProfilePageError = (_error): _error is { message: string; status: number } => false,
  logger = console,
  reorderLinkItems,
  reorderTextBoxItems,
  updateLinkItem,
  updateProfileMetadata,
  updateTextBoxItem,
}: ProfilePageApiDependencies) => {
  const app = new Hono();

  app.get("/", async (context) => {
    const session = await getSession();

    if (!isAuthenticatedSession(session)) {
      return unauthorizedResponse();
    }

    const data = await getProfilePageEditorData(session.user.id, context.req.query("handle"));

    if (!data) {
      return jsonResponse({ error: "Profile page not found." }, 404);
    }

    return jsonResponse(data, 200);
  });

  app.patch("/", async (context) => {
    const session = await getSession();

    if (!isAuthenticatedSession(session)) {
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
      if (isProfilePageError(error)) {
        return jsonResponse({ error: error.message }, error.status);
      }

      logger.error("Failed to update profile page:", error);
      return jsonResponse({ error: "Failed to update profile page." }, 500);
    }
  });

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

  app.post("/links/reorder", async (context) => {
    const session = await getSession();

    if (!isAuthenticatedSession(session)) {
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
      if (isProfilePageError(error)) {
        return jsonResponse({ error: error.message }, error.status);
      }

      logger.error("Failed to reorder link items:", error);
      return jsonResponse({ error: "Failed to reorder link items." }, 500);
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

  app.post("/text", async (context) => {
    const session = await getSession();

    if (!isAuthenticatedSession(session)) {
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
      if (isProfilePageError(error)) {
        return jsonResponse({ error: error.message }, error.status);
      }

      logger.error("Failed to create text box item:", error);
      return jsonResponse({ error: "Failed to create text box item." }, 500);
    }
  });

  app.post("/text/reorder", async (context) => {
    const session = await getSession();

    if (!isAuthenticatedSession(session)) {
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
      if (isProfilePageError(error)) {
        return jsonResponse({ error: error.message }, error.status);
      }

      logger.error("Failed to reorder text box items:", error);
      return jsonResponse({ error: "Failed to reorder text box items." }, 500);
    }
  });

  app.patch("/text/:textBoxId", async (context) => {
    const session = await getSession();

    if (!isAuthenticatedSession(session)) {
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
      if (isProfilePageError(error)) {
        return jsonResponse({ error: error.message }, error.status);
      }

      logger.error("Failed to update text box item:", error);
      return jsonResponse({ error: "Failed to update text box item." }, 500);
    }
  });

  app.delete("/text/:textBoxId", async (context) => {
    const session = await getSession();

    if (!isAuthenticatedSession(session)) {
      return unauthorizedResponse();
    }

    try {
      await deleteTextBoxItem({
        textBoxId: context.req.param("textBoxId"),
        userId: session.user.id,
      });

      return jsonResponse({ success: true }, 200);
    } catch (error) {
      if (isProfilePageError(error)) {
        return jsonResponse({ error: error.message }, error.status);
      }

      logger.error("Failed to delete text box item:", error);
      return jsonResponse({ error: "Failed to delete text box item." }, 500);
    }
  });

  return app;
};
