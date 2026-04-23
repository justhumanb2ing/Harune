import { SectionTransitionScope } from "@/components/section/profile-page/section-transition-scope";
import Sidebar from "@/components/sections/sidebar";
import type React from "react";

export default function SidebarLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex h-dvh min-h-dvh flex-row gap-4 overflow-hidden">
      <aside className="h-full shrink-0 px-4 py-6">
        <Sidebar />
      </aside>
      <SectionTransitionScope>
        <div className="relative h-full min-h-0 grow overflow-hidden">{children}</div>
      </SectionTransitionScope>
    </main>
  );
}
