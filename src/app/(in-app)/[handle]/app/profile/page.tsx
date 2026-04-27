import { ProfileSectionEditor } from "@/components/section/profile-page/profile-section-editor";
import { SectionRouteTransition } from "@/components/section/profile-page/section-route-transition";

export default function ProfilePage() {
  return (
    <SectionRouteTransition id="/app/profile">
      <ProfileSectionEditor />
    </SectionRouteTransition>
  );
}
