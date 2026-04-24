import { auth } from "@/auth";
import { db } from "@/db";
import { profilePages } from "@/db/schema/profile-page";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

type PostSignInPageProps = {
  searchParams: Promise<{
    handle?: string;
    next?: string;
  }>;
};

function getSafeRedirectPath(value?: string) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/section";
  }

  return value;
}

function resolveSectionRedirectPath(path: string, handle: string) {
  if (path === "/section") {
    return `/${handle}/section`;
  }

  if (path.startsWith("/section/")) {
    return `/${handle}${path}`;
  }

  return path;
}

export default async function PostSignInPage({ searchParams }: PostSignInPageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const { handle, next } = await searchParams;
  const nextPath = getSafeRedirectPath(next);
  const ownedPage = await db
    .select({
      id: profilePages.id,
      handle: profilePages.handle,
    })
    .from(profilePages)
    .where(eq(profilePages.userId, session.user.id))
    .limit(1)
    .then((rows) => rows[0]);

  if (!ownedPage) {
    const onboardingParams = new URLSearchParams();

    if (handle) {
      onboardingParams.set("handle", handle);
    }

    if (nextPath !== "/section") {
      onboardingParams.set("next", nextPath);
    }

    const onboardingUrl = `/onboarding${
      onboardingParams.toString() ? `?${onboardingParams.toString()}` : ""
    }`;

    redirect(onboardingUrl);
  }

  redirect(resolveSectionRedirectPath(nextPath, ownedPage.handle));
}
