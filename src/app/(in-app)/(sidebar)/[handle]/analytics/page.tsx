import { AnalyticsPageClient } from "@/app/(in-app)/(sidebar)/[handle]/analytics/page-client";
import { auth } from "@/auth";
import { profilePageServerQueryOptions } from "@/lib/profile-page/server-query-options";
import { SsgoiTransition } from "@ssgoi/react";
import { QueryClient } from "@tanstack/react-query";
import { redirect } from "next/navigation";

type AnalyticsPageProps = {
  params: Promise<{
    handle: string;
  }>;
};

export default async function AnalyticsPage({ params }: AnalyticsPageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const { handle } = await params;
  const queryClient = new QueryClient();
  const profilePageQuery = profilePageServerQueryOptions(session.user.id);

  await queryClient.prefetchQuery(profilePageQuery);
  const profilePageData = queryClient.getQueryData(profilePageQuery.queryKey);

  if (!profilePageData?.page.handle) {
    redirect("/onboarding");
  }

  if (profilePageData.page.handle !== handle) {
    redirect(`/${profilePageData.page.handle}/analytics`);
  }

  return (
    <SsgoiTransition id="/analytics" className="block h-full">
      <main className="flex h-full min-h-0 p-8 flex-col gap-12">
        <header className="space-y-3">
          <h1 className="text-3xl">Analytics</h1>
        </header>
        <AnalyticsPageClient />
      </main>
    </SsgoiTransition>
  );
}
