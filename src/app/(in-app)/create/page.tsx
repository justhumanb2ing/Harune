import { SsgoiTransition } from "@ssgoi/react";
import { desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { OnboardingForm } from "@/components/onboarding/onboarding-form";
import { db } from "@/db";
import { profilePages } from "@/db/schema/profile-page";
import { MAX_PROFILE_PAGE_COUNT } from "@/lib/profile-page/limits";
import { getOwnedProfilePageCount } from "@/lib/profile-page/queries";

type OnboardingPageProps = {
  searchParams: Promise<{
    handle?: string;
  }>;
};

export default async function OnboardingPage({ searchParams }: OnboardingPageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const ownedPage = await db
    .select({
      id: profilePages.id,
      handle: profilePages.handle,
    })
    .from(profilePages)
    .where(eq(profilePages.userId, session.user.id))
    .orderBy(desc(profilePages.createdAt))
    .limit(1)
    .then((rows) => rows[0]);
  const profilePageCount = await getOwnedProfilePageCount(session.user.id);

  const { handle } = await searchParams;

  if (profilePageCount >= MAX_PROFILE_PAGE_COUNT && ownedPage) {
    redirect(`/${ownedPage.handle}/app`);
  }

  return (
    <SsgoiTransition id="/create" className="block h-full">
      <OnboardingForm handle={handle} />
    </SsgoiTransition>
  );
}
