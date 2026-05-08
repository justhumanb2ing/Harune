import { SsgoiTransition } from "@ssgoi/react";
import { redirect } from "next/navigation";
import { OnboardingForm } from "@/components/onboarding/onboarding-form";
import { resolveAppEntryHref } from "@/lib/auth/app-entry";
import { getServerMe } from "@/lib/users/server-me";

type OnboardingPageProps = {
  searchParams: Promise<{
    handle?: string;
  }>;
};

export default async function OnboardingPage({ searchParams }: OnboardingPageProps) {
  const { handle } = await searchParams;
  const me = await getServerMe();
  const callbackTarget = new URLSearchParams();
  if (handle) callbackTarget.set("handle", handle);
  const callbackUrl = `/create${callbackTarget.toString() ? `?${callbackTarget.toString()}` : ""}`;

  if (!me) {
    redirect(`/sign-in?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }

  if (me.profilePage) {
    redirect(
      resolveAppEntryHref({
        profilePage: me.profilePage,
      })
    );
  }

  return (
    <SsgoiTransition id="/create" className="block h-full">
      <OnboardingForm handle={handle} />
    </SsgoiTransition>
  );
}
