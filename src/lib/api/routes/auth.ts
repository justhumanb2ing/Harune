import { apiFactory } from "@/lib/api/hono-factory";

type BetterAuthHandler = (request: Request) => Promise<Response> | Response;

type AuthApiDependencies = {
  handler: BetterAuthHandler;
};

export const createAuthApi = ({ handler }: AuthApiDependencies) => {
  const app = apiFactory.createApp();

  app.on(["DELETE", "GET", "PATCH", "POST", "PUT"], "/api/auth/*", (context) => {
    return handler(context.req.raw);
  });

  return app;
};

export type AuthApi = ReturnType<typeof createAuthApi>;
