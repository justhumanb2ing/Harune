import { OnboardingLayoutTransition } from "@/components/animation/onboarding-layout-transition";
import type { ReactNode } from "react";

export default function OnboardingLayout({ children }: { children: ReactNode }) {
  return <OnboardingLayoutTransition>{children}</OnboardingLayoutTransition>;
}
