import { AnalyticsPageClient } from "@/app/(in-app)/(sidebar)/analytics/page-client";
import { auth } from "@/auth";
import { profileAnalyticsServerQueryOptions } from "@/lib/analytics/server-query-options";
import { HydrationBoundary, QueryClient, dehydrate } from "@tanstack/react-query";
import { Suspense } from "react";

export default async function AnalyticsPage() {
  const queryClient = new QueryClient();
  const session = await auth();
  const userId = session?.user.id as string;

  await queryClient.prefetchQuery(profileAnalyticsServerQueryOptions({ userId }));

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <main className="flex h-full min-h-0 p-8 flex-col gap-12">
        <header className="space-y-3">
          <h1 className="text-3xl">Analytics</h1>
        </header>

        <Suspense fallback={<div />}>
          <AnalyticsPageClient />
        </Suspense>
      </main>
    </HydrationBoundary>
  );
}
