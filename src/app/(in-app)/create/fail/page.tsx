import { SsgoiTransition } from "@ssgoi/react";
import { desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { OnboardingFail } from "@/components/onboarding/onboarding-fail";
import { db } from "@/db";
import { profilePages } from "@/db/schema/profile-page";
import { normalizeHandle } from "@/lib/handles";
import { MAX_PROFILE_PAGE_COUNT } from "@/lib/profile-page/limits";
import { getOwnedProfilePageCount } from "@/lib/profile-page/queries";

type OnboardingFailPageProps = {
  searchParams: Promise<{
    handle?: string;
    message?: string;
  }>;
};

export default async function OnboardingFailPage({ searchParams }: OnboardingFailPageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const ownedPage = await db
    .select({
      handle: profilePages.handle,
    })
    .from(profilePages)
    .where(eq(profilePages.userId, session.user.id))
    .orderBy(desc(profilePages.createdAt))
    .limit(1)
    .then((rows) => rows[0]);
  const profilePageCount = await getOwnedProfilePageCount(session.user.id);

  if (profilePageCount >= MAX_PROFILE_PAGE_COUNT && ownedPage?.handle) {
    redirect(`/${ownedPage.handle}/app`);
  }

  const { handle: rawHandle, message } = await searchParams;
  const handle = normalizeHandle(rawHandle ?? "");

  return (
    <SsgoiTransition id="/create/fail" className="block h-full">
      <OnboardingFail handle={handle || undefined} message={message} />
    </SsgoiTransition>
  );
}
