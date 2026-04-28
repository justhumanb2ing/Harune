import type { ReactNode } from "react";
import { OnboardingLayoutTransition } from "@/components/transition/onboarding-layout-transition";

export default function OnboardingLayout({ children }: { children: ReactNode }) {
  return <OnboardingLayoutTransition>{children}</OnboardingLayoutTransition>;
}
