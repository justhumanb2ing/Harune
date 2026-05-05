import { getSessionCookie } from "better-auth/cookies";
import { z } from "zod";
import type { AuthSession } from "@/auth";
import { apiFactory, jsonResponse, noStoreHeaders, zQueryValidator } from "@/lib/api/hono-factory";
import {
  type MetadataErrorResponse,
  MetadataFetchError,
  type NormalizedMetadata,
} from "@/lib/metadata/url-metadata";
import { handleSchema } from "@/lib/validations/auth.schema";

type RootApiDependencies = {
  auth: () => Promise<AuthSession | null>;
  fetchUrlMetadata: (url: string) => Promise<NormalizedMetadata>;
  getProfilePageByHandle: (handle: string) => Promise<{ id: string } | null>;
  getSafeRedirectPath: (path?: string) => string;
  logger?: Pick<Console, "error">;
  resolveAuthenticatedAppRedirect: (input: {
    handle?: string;
    next?: string;
    userId: string;
  }) => Promise<string>;
};

export const createRootApi = ({
  auth: getSession,
  fetchUrlMetadata,
  getProfilePageByHandle,
  getSafeRedirectPath,
  logger = console,
  resolveAuthenticatedAppRedirect,
}: RootApiDependencies) => {
  const app = apiFactory.createApp();

  const routes = app
    .get(
      "/api/handle/availability",
      zQueryValidator(z.object({ handle: handleSchema }), (error) => ({
        error: error.issues[0]?.message ?? "Invalid handle.",
      })),
      async (context) => {
        const { handle } = context.req.valid("query");
        const existingOwner = await getProfilePageByHandle(handle);

        return jsonResponse(context, {
          available: !existingOwner,
        });
      }
    )
    .get(
      "/api/crawl",
      zQueryValidator(
        z.object({ url: z.string().min(1, "Missing URL.") }),
        (error) => ({
          error:
            error.issues[0]?.code === "invalid_type"
              ? "Missing URL."
              : (error.issues[0]?.message ?? "Missing URL."),
        }),
        { noStore: true }
      ),
      async (context) => {
        const { url } = context.req.valid("query");

        try {
          const metadata = await fetchUrlMetadata(url);

          return jsonResponse(context, metadata, { headers: noStoreHeaders });
        } catch (error) {
          if (error instanceof MetadataFetchError) {
            return jsonResponse(context, error.body, {
              headers: noStoreHeaders,
              status: error.status,
            });
          }

          const body: MetadataErrorResponse = {
            error: "internal_error",
            message: error instanceof Error ? error.message : "Failed to fetch metadata.",
          };

          return jsonResponse(context, body, { headers: noStoreHeaders, status: 502 });
        }
      }
    )
    .get("/api/join", async (context) => {
      const requestUrl = new URL(context.req.url);
      const sessionCookie = getSessionCookie(context.req.raw);

      if (!sessionCookie) {
        const signInUrl = new URL("/sign-in", requestUrl);
        signInUrl.searchParams.set(
          "callbackUrl",
          getSafeRedirectPath(`${requestUrl.pathname}${requestUrl.search}`)
        );

        return context.redirect(`${signInUrl.pathname}${signInUrl.search}`, 307);
      }

      const session = await getSession();

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

  return routes;
};

export type RootApi = ReturnType<typeof createRootApi>;
