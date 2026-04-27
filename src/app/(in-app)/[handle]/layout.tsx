import { auth } from "@/auth";
import { SectionTransitionScope } from "@/components/section/profile-page/section-transition-scope";
import SettingBox from "@/components/sections/setting-box";
import { meServerQueryOptions } from "@/lib/users/server-query-options";
import { HydrationBoundary, QueryClient, dehydrate } from "@tanstack/react-query";
import { redirect } from "next/navigation";
import type React from "react";

export default async function SidebarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
        <SectionTransitionScope>
          <div className="relative h-full min-h-0 grow overflow-hidden">{children}</div>
        </SectionTransitionScope>
      </main>
    </HydrationBoundary>
  );
}
