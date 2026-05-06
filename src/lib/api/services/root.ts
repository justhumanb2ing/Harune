import type { AuthSession } from "@/auth";
import {
  type MetadataErrorResponse,
  MetadataFetchError,
  type NormalizedMetadata,
} from "@/lib/metadata/url-metadata";

export type RootApiServices = {
  checkHandleAvailability(handle: string): Promise<{ available: boolean }>;
  fetchMetadata(
    url: string
  ): Promise<
    { body: MetadataErrorResponse; status: number } | { body: NormalizedMetadata; status: 200 }
  >;
  resolveJoinRedirect(input: {
    getSession: () => Promise<AuthSession | null>;
    hasSessionCookie: boolean;
    requestUrl: URL;
  }): Promise<{ location: string; shouldReadSession: boolean; status: 307 }>;
};

export type RootApiServiceDependencies = {
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

export const createRootApiServices = ({
  fetchUrlMetadata,
  getProfilePageByHandle,
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
    checkHandleAvailability: async (handle) => ({
      available: !(await getProfilePageByHandle(handle)),
    }),
    fetchMetadata: async (url) => {
      try {
        return {
          body: await fetchUrlMetadata(url),
          status: 200,
        };
      } catch (error) {
        if (error instanceof MetadataFetchError) {
          return {
            body: error.body,
            status: error.status,
          };
        }

        return {
          body: {
            error: "internal_error",
            message: error instanceof Error ? error.message : "Failed to fetch metadata.",
          },
          status: 502,
        };
      }
    },
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
