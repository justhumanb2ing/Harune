import { auth } from "@/auth";
import { db } from "@/db";
import { profilePages } from "@/db/schema/profile-page";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

type PostSignInPageProps = {
  searchParams: Promise<{
    handle?: string;
  }>;
};

export default async function PostSignInPage({ searchParams }: PostSignInPageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const { handle } = await searchParams;
  const ownedPage = await db
    .select({
      id: profilePages.id,
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

    const onboardingUrl = `/onboarding${
      onboardingParams.toString() ? `?${onboardingParams.toString()}` : ""
    }`;

    redirect(onboardingUrl);
  }

  redirect("/section");
}
