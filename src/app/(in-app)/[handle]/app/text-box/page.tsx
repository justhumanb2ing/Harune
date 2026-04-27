import { SectionRouteTransition } from "@/components/section/profile-page/section-route-transition";
import { TextBoxesSectionEditor } from "@/components/section/profile-page/text-boxes-section-editor";

export default function TextBoxSectionPage() {
  return (
    <SectionRouteTransition id="/app/text-box">
      <TextBoxesSectionEditor />
    </SectionRouteTransition>
  );
}
