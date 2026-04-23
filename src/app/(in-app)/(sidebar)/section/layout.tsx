import { ProfilePageEditorProvider } from "@/components/section/profile-page/profile-page-editor-provider";
import { ProfilePagePreview } from "@/components/section/profile-page/profile-page-preview";
import type { ReactNode } from "react";

export default function SectionLayout({ children }: { children: ReactNode }) {
  return (
    <ProfilePageEditorProvider>
      <div className="flex h-full min-h-0 flex-row gap-4">
        <section className="min-h-0 flex-1 overflow-auto">
          <div className="container mx-auto max-w-md py-10">{children}</div>
        </section>
        <section className="min-h-0 flex-1 overflow-auto">
          <ProfilePagePreview />
        </section>
      </div>
    </ProfilePageEditorProvider>
  );
}
