import { SectionRouteTransition } from "@/components/section/profile-page/section-route-transition";
import { SocialLinksSectionEditor } from "@/components/section/profile-page/social-links-section-editor";

export default function SocialSectionPage() {
  return (
    <SectionRouteTransition id="/app/social">
      <SocialLinksSectionEditor />
    </SectionRouteTransition>
  );
}
