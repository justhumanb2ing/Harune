import { LinksSectionEditor } from "@/components/section/profile-page/links-section-editor";
import { SectionRouteTransition } from "@/components/section/profile-page/section-route-transition";

export default function LinkSectionPage() {
  return (
    <SectionRouteTransition id="/app/link">
      <LinksSectionEditor />
    </SectionRouteTransition>
  );
}
