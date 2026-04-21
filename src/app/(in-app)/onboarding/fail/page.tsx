import { OnboardingFail } from "@/components/auth/onboarding-fail";
import { normalizeHandle } from "@/lib/handles";

type OnboardingFailPageProps = {
  searchParams: Promise<{
    handle?: string;
  }>;
};

export default async function OnboardingFailPage({ searchParams }: OnboardingFailPageProps) {
  const handle = normalizeHandle((await searchParams).handle ?? "");

  return <OnboardingFail handle={handle || undefined} />;
}
