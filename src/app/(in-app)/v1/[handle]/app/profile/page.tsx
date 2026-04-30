import { ProfileSectionEditor } from "@/components/profile-page/editor-core/profile-section-editor";
import { ProfileLayoutTransition } from "@/components/transition/profile-layout-transition";

export default function ProfilePage() {
  return (
    <ProfileLayoutTransition id="/app/profile">
      <ProfileSectionEditor />
    </ProfileLayoutTransition>
  );
}
