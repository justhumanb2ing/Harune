import { ProfileSectionEditor } from "@/components/section/profile-page/profile-section-editor";
import { SsgoiTransition } from "@ssgoi/react";

export default function ProfilePage() {
  return (
    <SsgoiTransition id="/app/profile" className="block h-full">
      <ProfileSectionEditor />
    </SsgoiTransition>
  );
}
