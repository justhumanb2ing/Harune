import { SectionPageClient } from "@/components/section/profile-page/section-page-client";
import { SectionRouteTransition } from "@/components/section/profile-page/section-route-transition";

export default function SectionPage() {
  return (
    <SectionRouteTransition id="/app">
      <SectionPageClient />
    </SectionRouteTransition>
  );
}
