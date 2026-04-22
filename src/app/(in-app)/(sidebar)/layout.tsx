import { ProfilePageEditorProvider } from "@/components/section/profile-page/profile-page-editor-provider";
import { ProfilePagePreview } from "@/components/section/profile-page/profile-page-preview";
import Sidebar from "@/components/sections/sidebar";
import type React from "react";

export default function SidebarLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProfilePageEditorProvider>
      <main className="flex h-dvh min-h-dvh flex-row gap-4 overflow-hidden">
        <aside className="h-full shrink-0 px-4 py-6">
          <Sidebar />
        </aside>

        <div className="flex h-full min-h-0 grow flex-row gap-4">
          <section className="min-h-0 flex-1 overflow-auto p-10">{children}</section>
          <section className="min-h-0 flex-1 overflow-auto p-10">
            <ProfilePagePreview />
          </section>
        </div>
      </main>
    </ProfilePageEditorProvider>
  );
}
