import { SsgoiTransition } from "@ssgoi/react";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { OnboardingForm } from "@/components/onboarding/onboarding-form";
import { db } from "@/db";
import { profilePages } from "@/db/schema/profile";
import { getProfileAppPath } from "@/lib/profile/app-paths";

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
      handle: profilePages.handle,
    })
    .from(profilePages)
    .where(eq(profilePages.userId, session.user.id))
    .limit(1)
    .then((rows) => rows[0]);

  const { handle } = await searchParams;

  if (ownedPage) {
    redirect(getProfileAppPath(ownedPage.handle));
  }

  return (
    <SsgoiTransition id="/create" className="block h-full">
      <OnboardingForm handle={handle} />
    </SsgoiTransition>
  );
}
