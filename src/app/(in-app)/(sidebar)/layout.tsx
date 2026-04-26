import { SectionTransitionScope } from "@/components/section/profile-page/section-transition-scope";
import SettingBox from "@/components/sections/setting-box";
import type React from "react";

export default function SidebarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="relative flex h-dvh min-h-dvh flex-row gap-4 overflow-hidden">
      <SettingBox />
      <SectionTransitionScope>
        <div className="relative h-full min-h-0 grow overflow-hidden">{children}</div>
      </SectionTransitionScope>
    </main>
  );
}
