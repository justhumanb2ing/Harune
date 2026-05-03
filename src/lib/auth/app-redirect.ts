import { eq } from "drizzle-orm";
import { db } from "@/db";
import { profilePages } from "@/db/schema/profile";
import { getSafeRedirectPath, resolveAppRedirectPath } from "@/lib/auth/app-redirect-paths";

type ResolveAuthenticatedAppRedirectOptions = {
  handle?: string;
  next?: string;
  userId: string;
};

export { getSafeRedirectPath, resolveAppRedirectPath };

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
