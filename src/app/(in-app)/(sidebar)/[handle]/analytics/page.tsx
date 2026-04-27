import { AnalyticsPageClient } from "@/app/(in-app)/(sidebar)/[handle]/analytics/page-client";
import { auth } from "@/auth";
import { normalizeAnalyticsTimezone } from "@/lib/analytics/analytics-ranges";
import { profileAnalyticsServerQueryOptions } from "@/lib/analytics/server-query-options";
import { profilePageServerQueryOptions } from "@/lib/profile-page/server-query-options";
import { SsgoiTransition } from "@ssgoi/react";
import {
  HydrationBoundary,
  QueryClient,
  dehydrate,
} from "@tanstack/react-query";
import { headers } from "next/headers";
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
    redirect("/create");
  }

  if (profilePageData.page.handle !== handle) {
    redirect(`/${profilePageData.page.handle}/analytics`);
  }

  const requestHeaders = await headers();
  const timezone = normalizeAnalyticsTimezone(
    requestHeaders.get("x-vercel-ip-timezone"),
  );

  await queryClient.prefetchQuery(
    profileAnalyticsServerQueryOptions({
      profilePageId: profilePageData.page.id,
      timezone,
      userId: session.user.id,
    }),
  );

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <SsgoiTransition id="/analytics" className="block h-full min-h-0">
        <main className="flex h-full min-h-0 flex-col gap-12 overflow-y-auto p-4 sm:p-8">
          <AnalyticsPageClient />
        </main>
      </SsgoiTransition>
    </HydrationBoundary>
  );
}
