"use client";

import { useGetMeAnalytics } from "@/lib/api/generated/http/me-api/me-api";
import type { GetMeAnalytics200 } from "@/lib/api/generated/http/schemas/me-api";

function AnalyticsVisitorsCard() {
  const analyticsQuery = useGetMeAnalytics<GetMeAnalytics200>({
    query: {
      refetchOnWindowFocus: false,
      staleTime: 60_000,
      select: (response) => {
        if (response.status !== 200) {
          throw new Error("Analytics could not be loaded.");
        }

        return response.data;
      },
    },
  });

  if (analyticsQuery.isPending) {
    return (
      <div className="rounded-3xl border bg-card p-6 shadow-sm">
        <div className="h-6 w-40 animate-pulse rounded bg-muted" />
        <div className="mt-4 h-12 w-24 animate-pulse rounded bg-muted" />
      </div>
    );
  }

  if (analyticsQuery.isError) {
    return (
      <div className="rounded-3xl border bg-card p-6 text-sm text-muted-foreground shadow-sm">
        Analytics could not be loaded.
      </div>
    );
  }

  return (
    <section className="rounded-3xl border bg-card p-6 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        Today
      </p>
      <div className="mt-4 flex items-end gap-3">
        <span className="text-4xl font-semibold tracking-tight">
          {analyticsQuery.data.visitors.toLocaleString()}
        </span>
        <span className="pb-1 text-sm text-muted-foreground">visitors</span>
      </div>
    </section>
  );
}

export function AnalyticsPageClient() {
  return (
    <section className="container mx-auto max-w-3xl">
      <div className="flex flex-col gap-6">
        <header className="flex flex-row items-center justify-between gap-4">
          <h1 className="text-3xl font-semibold">Analytics</h1>
        </header>

        <AnalyticsVisitorsCard />
      </div>
    </section>
  );
}
