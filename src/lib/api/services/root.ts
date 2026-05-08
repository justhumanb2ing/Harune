import type { AuthSession } from "@/auth";

export type RootApiServices = {
  resolveJoinRedirect(input: {
    getSession: () => Promise<AuthSession | null>;
    hasSessionCookie: boolean;
    requestUrl: URL;
  }): Promise<{ location: string; shouldReadSession: boolean; status: 307 }>;
};

export type RootApiServiceDependencies = {
  getSafeRedirectPath: (path?: string) => string;
  logger?: Pick<Console, "error">;
  resolveAuthenticatedAppRedirect: (input: {
    handle?: string;
    next?: string;
    userId: string;
  }) => Promise<string>;
};

export const createRootApiServices = ({
  getSafeRedirectPath,
  logger = console,
  resolveAuthenticatedAppRedirect,
}: RootApiServiceDependencies): RootApiServices => {
  const getAnonymousSignInRedirect = (requestUrl: URL) => {
    const signInUrl = new URL("/sign-in", requestUrl);
    signInUrl.searchParams.set(
      "callbackUrl",
      getSafeRedirectPath(`${requestUrl.pathname}${requestUrl.search}`)
    );

    return `${signInUrl.pathname}${signInUrl.search}`;
  };

  return {
    resolveJoinRedirect: async ({ getSession, hasSessionCookie, requestUrl }) => {
      if (!hasSessionCookie) {
        return {
          location: getAnonymousSignInRedirect(requestUrl),
          shouldReadSession: false,
          status: 307,
        };
      }

      const session = await getSession();

      if (!session?.user?.id) {
        return {
          location: getAnonymousSignInRedirect(requestUrl),
          shouldReadSession: true,
          status: 307,
        };
      }

      try {
        return {
          location: await resolveAuthenticatedAppRedirect({
            handle: requestUrl.searchParams.get("handle") ?? undefined,
            next: requestUrl.searchParams.get("next") ?? undefined,
            userId: session.user.id,
          }),
          shouldReadSession: true,
          status: 307,
        };
      } catch (error) {
        logger.error("Failed to resolve app join redirect:", error);
        return {
          location: "/create",
          shouldReadSession: true,
          status: 307,
        };
      }
    },
  };
};
