import { OnboardingFail } from "@/components/auth/onboarding-fail";
import { normalizeHandle } from "@/lib/handles";

type OnboardingFailPageProps = {
  searchParams: Promise<{
    handle?: string;
    message?: string;
  }>;
};

export default async function OnboardingFailPage({ searchParams }: OnboardingFailPageProps) {
  const { handle: rawHandle, message } = await searchParams;
  const handle = normalizeHandle(rawHandle ?? "");

  return <OnboardingFail handle={handle || undefined} message={message} />;
}
