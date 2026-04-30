import { SocialLinksSectionEditor } from "@/components/profile-page/editor-core/social-links-section-editor";
import { ProfileLayoutTransition } from "@/components/transition/profile-layout-transition";

export default function SocialSectionPage() {
  return (
    <ProfileLayoutTransition id="/app/social">
      <SocialLinksSectionEditor />
    </ProfileLayoutTransition>
  );
}
