import { db } from "@/db";
import { profilePages } from "@/db/schema/profile-page";
import { eq } from "drizzle-orm";

type ResolveAuthenticatedAppRedirectOptions = {
  handle?: string;
  next?: string;
  userId: string;
};

export function getSafeRedirectPath(value?: string) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/app";
  }

  return value;
}

export function resolveAppRedirectPath(path: string, handle: string) {
  if (path === "/app" || path === "/section") {
    return `/${handle}/app`;
  }

  if (path.startsWith("/app/")) {
    return `/${handle}${path}`;
  }

  if (path.startsWith("/section/")) {
    return `/${handle}/app/${path.slice("/section/".length)}`;
  }

  return path;
}

export async function resolveAuthenticatedAppRedirect({
  handle,
  next,
  userId,
}: ResolveAuthenticatedAppRedirectOptions) {
  const nextPath = getSafeRedirectPath(next);
  const ownedPage = await db
    .select({
      id: profilePages.id,
      handle: profilePages.handle,
    })
    .from(profilePages)
    .where(eq(profilePages.userId, userId))
    .limit(1)
    .then((rows) => rows[0]);

  if (!ownedPage) {
    const onboardingParams = new URLSearchParams();

    if (handle) {
      onboardingParams.set("handle", handle);
    }

    if (nextPath !== "/app") {
      onboardingParams.set("next", nextPath);
    }

    return `/create${onboardingParams.toString() ? `?${onboardingParams.toString()}` : ""}`;
  }

  return resolveAppRedirectPath(nextPath, ownedPage.handle);
}
