import { Hono } from "hono";
import type { AuthSession } from "@/auth";
import type { UrlMetadata } from "@/lib/metadata/url-metadata";
import { handleSchema } from "@/lib/validations/auth.schema";

type RootApiDependencies = {
  auth: () => Promise<AuthSession | null>;
  fetchUrlMetadata: (url: string) => Promise<UrlMetadata>;
  getProfilePageByHandle: (handle: string) => Promise<{ id: string } | null>;
  getSafeRedirectPath: (path?: string) => string;
  logger?: Pick<Console, "error">;
  resolveAuthenticatedAppRedirect: (input: {
    handle?: string;
    next?: string;
    userId: string;
  }) => Promise<string>;
};

const noStoreHeaders = {
  "Cache-Control": "no-store",
};

const jsonResponse = (
  body: unknown,
  init: {
    headers?: HeadersInit;
    status?: number;
  } = {}
) => {
  return new Response(JSON.stringify(body), {
    headers: {
      "Content-Type": "application/json",
      ...init.headers,
    },
    status: init.status ?? 200,
  });
};

export const createRootApi = ({
  auth: getSession,
  fetchUrlMetadata,
  getProfilePageByHandle,
  getSafeRedirectPath,
  logger = console,
  resolveAuthenticatedAppRedirect,
}: RootApiDependencies) => {
  const app = new Hono();

  app.get("/api/handles/availability", async (context) => {
    const validation = handleSchema.safeParse(context.req.query("handle") ?? null);

    if (!validation.success) {
      return jsonResponse(
        {
          error: validation.error.issues[0]?.message ?? "Invalid handle.",
        },
        { status: 400 }
      );
    }

    const existingOwner = await getProfilePageByHandle(validation.data);

    return jsonResponse({
      available: !existingOwner,
    });
  });

  app.get("/api/test", async (context) => {
    const url = context.req.query("url");

    if (!url) {
      return jsonResponse({ error: "Missing URL." }, { headers: noStoreHeaders, status: 400 });
    }

    try {
      const metadata = await fetchUrlMetadata(url);

      return jsonResponse(metadata, { headers: noStoreHeaders });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch metadata.";
      const status = message.includes("Invalid URL") || message.includes("Only HTTP") ? 400 : 502;

      return jsonResponse({ error: message }, { headers: noStoreHeaders, status });
    }
  });

  app.get("/api/join", async (context) => {
    const session = await getSession();
    const requestUrl = new URL(context.req.url);

    if (!session?.user?.id) {
      const signInUrl = new URL("/sign-in", requestUrl);
      signInUrl.searchParams.set(
        "callbackUrl",
        getSafeRedirectPath(`${requestUrl.pathname}${requestUrl.search}`)
      );

      return context.redirect(`${signInUrl.pathname}${signInUrl.search}`, 307);
    }

    try {
      return context.redirect(
        await resolveAuthenticatedAppRedirect({
          handle: requestUrl.searchParams.get("handle") ?? undefined,
          next: requestUrl.searchParams.get("next") ?? undefined,
          userId: session.user.id,
        }),
        307
      );
    } catch (error) {
      logger.error("Failed to resolve app join redirect:", error);
      return context.redirect("/create", 307);
    }
  });

  return app;
};
