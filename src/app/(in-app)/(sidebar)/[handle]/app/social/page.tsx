import { SocialLinksSectionEditor } from "@/components/section/profile-page/social-links-section-editor";
import { SsgoiTransition } from "@ssgoi/react";

export default function SocialSectionPage() {
  return (
    <SsgoiTransition id="/app/social" className="block h-full">
      <SocialLinksSectionEditor />
    </SsgoiTransition>
  );
}
