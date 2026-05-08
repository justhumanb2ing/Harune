import { getSessionCookie } from "better-auth/cookies";
import type { AuthSession } from "@/auth";
import { apiFactory, jsonResponse, zQueryValidator } from "@/lib/api/hono-factory";
import { rootHandleAvailabilityQuerySchema } from "@/lib/api/schemas/root";
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
