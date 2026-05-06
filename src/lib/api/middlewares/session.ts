import type { Context } from "hono";
import type { AuthSession } from "@/auth";
import { type ApiBindings, apiFactory } from "@/lib/api/hono-factory";

type AuthenticatedSession = NonNullable<
  AuthSession & {
    user: {
      email: string;
      id: string;
    };
  }
>;

export const isAuthenticatedSession = (
  session: AuthSession | null
): session is AuthenticatedSession => {
  return Boolean(session?.user?.id && session.user.email);
};

export const createSessionMiddleware = (getSession: () => Promise<AuthSession | null>) =>
  apiFactory.createMiddleware(async (context, next) => {
    const session = await getSession();

    context.set("session", session);
    context.set("authenticatedSession", isAuthenticatedSession(session) ? session : null);

    await next();
  });

export const getAuthenticatedSession = (context: Context<ApiBindings>) =>
  context.get("authenticatedSession");
