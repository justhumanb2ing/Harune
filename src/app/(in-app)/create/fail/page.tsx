import { SsgoiTransition } from "@ssgoi/react";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { OnboardingFail } from "@/components/onboarding/onboarding-fail";
import { db } from "@/db";
import { profilePages } from "@/db/schema/profile";
import { normalizeHandle } from "@/lib/handles";
import { getProfileAppPath } from "@/lib/profile/app-paths";

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
    .limit(1)
    .then((rows) => rows[0]);

  if (ownedPage?.handle) {
    redirect(getProfileAppPath(ownedPage.handle));
  }

  const { handle: rawHandle, message } = await searchParams;
  const handle = normalizeHandle(rawHandle ?? "");

  return (
    <SsgoiTransition id="/create/fail" className="block h-full">
      <OnboardingFail handle={handle || undefined} message={message} />
    </SsgoiTransition>
  );
}
