import { TextBoxesSectionEditor } from "@/components/section/profile-page/text-boxes-section-editor";
import { SsgoiTransition } from "@ssgoi/react";

export default function TextBoxSectionPage() {
  return (
    <SsgoiTransition id="/section/text-box" className="block h-full">
      <TextBoxesSectionEditor />
    </SsgoiTransition>
  );
}
