import { LinksSectionEditor } from "@/components/profile-page/editor-core/links-section-editor";
import { ProfileLayoutTransition } from "@/components/transition/profile-layout-transition";

export default function LinkSectionPage() {
  return (
    <ProfileLayoutTransition id="/app/link">
      <LinksSectionEditor />
    </ProfileLayoutTransition>
  );
}
