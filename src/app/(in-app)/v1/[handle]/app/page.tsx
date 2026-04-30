import { SectionPageClient } from "@/components/profile-page/layout/section-page-client";
import { ProfileLayoutTransition } from "@/components/transition/profile-layout-transition";

export default function SectionPage() {
  return (
    <ProfileLayoutTransition id="/app">
      <SectionPageClient />
    </ProfileLayoutTransition>
  );
}
