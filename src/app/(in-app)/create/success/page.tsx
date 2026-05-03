import { SsgoiTransition } from "@ssgoi/react";
import { desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { OnboardingSuccess } from "@/components/onboarding/onboarding-success";
import { db } from "@/db";
import { profilePages } from "@/db/schema/profile";

type OnboardingSuccessPageProps = {
  searchParams: Promise<{
    handle?: string;
  }>;
};

export default async function OnboardingSuccessPage({ searchParams }: OnboardingSuccessPageProps) {
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

  const { handle: routeHandle } = await searchParams;
  const resolvedHandle = routeHandle ?? ownedPage?.handle;

  if (!resolvedHandle) {
    redirect("/create");
  }

  return (
    <SsgoiTransition id="/create/success" className="block h-full">
      <OnboardingSuccess handle={resolvedHandle} />
    </SsgoiTransition>
  );
}
