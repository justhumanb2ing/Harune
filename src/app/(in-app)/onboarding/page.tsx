import { auth } from "@/auth";
import { OnboardingForm } from "@/components/auth/onboarding-form";
import { db } from "@/db";
import { profilePages } from "@/db/schema/profile-page";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

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
    })
    .from(profilePages)
    .where(eq(profilePages.userId, session.user.id))
    .limit(1)
    .then((rows) => rows[0]);

  const { handle } = await searchParams;

  if (ownedPage) {
    redirect("/section");
  }

  return <OnboardingForm handle={handle} />;
}
