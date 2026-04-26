import { SectionPageClient } from "@/components/section/profile-page/section-page-client";
import { SsgoiTransition } from "@ssgoi/react";

export default function SectionPage() {
  return (
    <SsgoiTransition id="/app" className="block h-full">
      <SectionPageClient />
    </SsgoiTransition>
  );
}
