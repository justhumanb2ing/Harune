import { AnalyticsPageClient } from "@/app/(in-app)/(sidebar)/analytics/page-client";
import { auth } from "@/auth";
import { normalizeAnalyticsTimezone } from "@/lib/analytics/analytics-ranges";
import { profileAnalyticsServerQueryOptions } from "@/lib/analytics/server-query-options";
import { HydrationBoundary, QueryClient, dehydrate } from "@tanstack/react-query";
import { headers } from "next/headers";
import { Suspense } from "react";

const resolveAnalyticsTimezoneFromRequest = async () => {
  const requestHeaders = await headers();

  return normalizeAnalyticsTimezone(requestHeaders.get("x-vercel-ip-timezone"));
};

export default async function AnalyticsPage() {
  const queryClient = new QueryClient();
  const session = await auth();
  const timezone = await resolveAnalyticsTimezoneFromRequest();
  const userId = session?.user.id as string;

  await queryClient.prefetchQuery(
    profileAnalyticsServerQueryOptions({
      timezone,
      userId,
    })
  );

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <main className="flex h-full min-h-0 p-8 flex-col gap-12">
        <header className="space-y-3">
          <h1 className="text-3xl">Analytics</h1>
        </header>

        <Suspense fallback={<div />}>
          <AnalyticsPageClient timezone={timezone} />
        </Suspense>
      </main>
    </HydrationBoundary>
  );
}
