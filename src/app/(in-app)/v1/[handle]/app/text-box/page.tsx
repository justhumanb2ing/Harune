import { TextSectionEditor } from "@/components/profile-page/editor-core/text-section-editor";
import { ProfileLayoutTransition } from "@/components/transition/profile-layout-transition";

export default function TextBoxSectionPage() {
  return (
    <ProfileLayoutTransition id="/app/text-box">
      <TextSectionEditor />
    </ProfileLayoutTransition>
  );
}
