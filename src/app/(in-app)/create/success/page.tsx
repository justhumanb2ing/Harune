import { SsgoiTransition } from "@ssgoi/react";
import { OnboardingSuccess } from "@/components/onboarding/onboarding-success";

type OnboardingSuccessPageProps = {
  searchParams: Promise<{
    handle?: string;
  }>;
};

export default async function OnboardingSuccessPage({ searchParams }: OnboardingSuccessPageProps) {
  const { handle } = await searchParams;

  return (
    <SsgoiTransition id="/create/success" className="block h-full">
      <OnboardingSuccess handle={handle || "preview"} />
    </SsgoiTransition>
  );
}
