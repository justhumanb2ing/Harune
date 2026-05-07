import { getSessionCookie } from "better-auth/cookies";
import type { AuthSession } from "@/auth";
import { apiFactory, jsonResponse, noStoreHeaders, zQueryValidator } from "@/lib/api/hono-factory";
import { crawlQuerySchema, rootHandleAvailabilityQuerySchema } from "@/lib/api/schemas/root";
import { createRootApiServices, type RootApiServiceDependencies } from "@/lib/api/services/root";

type RootApiDependencies = RootApiServiceDependencies & {
  auth: () => Promise<AuthSession | null>;
};

export const createRootApi = ({
  auth: getSession,
  ...serviceDependencies
}: RootApiDependencies) => {
  const app = apiFactory.createApp();
  const services = createRootApiServices(serviceDependencies);

  const routes = app
    .get(
      "/api/handle/availability",
      zQueryValidator(rootHandleAvailabilityQuerySchema, (error) => ({
        error: error.issues[0]?.message ?? "Invalid handle.",
      })),
      async (context) => {
        const { handle } = context.req.valid("query");

        return jsonResponse(context, await services.checkHandleAvailability(handle));
      }
    )
    .get(
      "/metadata",
      zQueryValidator(
        crawlQuerySchema,
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
        const result = await services.fetchMetadata(url);

        return jsonResponse(context, result.body, {
          headers: noStoreHeaders,
          status: result.status,
        });
      }
    )
    .get("/api/join", async (context) => {
      const result = await services.resolveJoinRedirect({
        getSession,
        hasSessionCookie: Boolean(getSessionCookie(context.req.raw)),
        requestUrl: new URL(context.req.url),
      });

      return context.redirect(result.location, result.status);
    });

  return routes;
};

export type RootApi = ReturnType<typeof createRootApi>;
