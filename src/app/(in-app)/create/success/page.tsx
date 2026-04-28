import { SsgoiTransition } from "@ssgoi/react";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { OnboardingSuccess } from "@/components/onboarding/onboarding-success";
import { db } from "@/db";
import { profilePages } from "@/db/schema/profile-page";

export default async function OnboardingSuccessPage() {
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

  if (!ownedPage?.handle) {
    redirect("/create");
  }

  return (
    <SsgoiTransition id="/create/success" className="block h-full">
      <OnboardingSuccess handle={ownedPage.handle} />
    </SsgoiTransition>
  );
}
