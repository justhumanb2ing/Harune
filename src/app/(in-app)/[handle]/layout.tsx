import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { redirect } from "next/navigation";
import type React from "react";
import { auth } from "@/auth";
import SettingBox from "@/components/profile-page/layout/setting-box";
import { ProfileLayoutTransitionScope } from "@/components/transition/profile-layout-transition";
import { meServerQueryOptions } from "@/lib/users/server-query-options";

export default async function SidebarLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const queryClient = new QueryClient();
  await queryClient.prefetchQuery(meServerQueryOptions(session.user.id));

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <main className="relative flex h-dvh min-h-dvh flex-row gap-4 overflow-hidden">
        <SettingBox />
        <ProfileLayoutTransitionScope>
          <div className="relative h-full min-h-0 grow overflow-hidden">{children}</div>
        </ProfileLayoutTransitionScope>
      </main>
    </HydrationBoundary>
  );
}
