import { SsgoiTransition } from "@ssgoi/react";
import { OnboardingFail } from "@/components/onboarding/onboarding-fail";

type OnboardingFailPageProps = {
  searchParams: Promise<{
    handle?: string;
    message?: string;
  }>;
};

export default async function OnboardingFailPage({ searchParams }: OnboardingFailPageProps) {
  const { handle, message } = await searchParams;

  return (
    <SsgoiTransition id="/create/fail" className="block h-full">
      <OnboardingFail handle={handle} message={message} />
    </SsgoiTransition>
  );
}
