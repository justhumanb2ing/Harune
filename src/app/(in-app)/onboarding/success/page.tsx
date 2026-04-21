import { auth } from "@/auth";
import { OnboardingSuccess } from "@/components/auth/onboarding-success";
import { db } from "@/db";
import { profilePages } from "@/db/schema/profile-page";
import { normalizeHandle } from "@/lib/handles";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

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

  const requestedHandle = normalizeHandle((await searchParams).handle ?? "");
  const ownedPage = await db
    .select({
      handle: profilePages.handle,
    })
    .from(profilePages)
    .where(eq(profilePages.userId, session.user.id))
    .limit(1)
    .then((rows) => rows[0]);

  if (!ownedPage?.handle) {
    const onboardingPath = requestedHandle
      ? `/onboarding?handle=${requestedHandle}`
      : "/onboarding";
    redirect(onboardingPath);
  }

  return <OnboardingSuccess handle={ownedPage.handle} />;
}
