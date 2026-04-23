import { LinksSectionEditor } from "@/components/section/profile-page/links-section-editor";
import { SsgoiTransition } from "@ssgoi/react";

export default function LinkSectionPage() {
  return (
    <SsgoiTransition id="/section/link" className="block h-full">
      <LinksSectionEditor />
    </SsgoiTransition>
  );
}
