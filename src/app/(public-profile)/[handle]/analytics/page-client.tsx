"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ProfileAnalyticsSummary } from "@/components/profile-page/layout/profile-analytics-summary";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AnalyticsRangeKey } from "@/lib/analytics/analytics-ranges";
import { profileAnalyticsQueryOptions } from "@/lib/analytics/query-options";

const analyticsRanges: Array<{ label: string; value: AnalyticsRangeKey }> = [
  { label: "Today", value: "today" },
  { label: "7 days", value: "7d" },
  { label: "30 days", value: "30d" },
];

type AnalyticsSummaryQueryProps = {
  range: AnalyticsRangeKey;
};

function AnalyticsSummaryQuery({ range }: AnalyticsSummaryQueryProps) {
  const analyticsQuery = useQuery(profileAnalyticsQueryOptions());

  if (analyticsQuery.isPending) {
    return <AnalyticsSummaryFallback />;
  }

  if (analyticsQuery.isError) {
    return (
      <div className="rounded-xl bg-background p-6 text-sm text-muted-foreground shadow-float">
        Analytics could not be loaded.
      </div>
    );
  }

  return <ProfileAnalyticsSummary range={range} response={analyticsQuery.data} />;
}

function AnalyticsSummaryFallback() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="min-h-28 animate-pulse rounded-xl bg-muted lg:aspect-square lg:min-h-0" />
        <div className="min-h-28 animate-pulse rounded-xl bg-muted lg:aspect-square lg:min-h-0" />
        <div className="min-h-28 animate-pulse rounded-xl bg-muted lg:aspect-square lg:min-h-0" />
        <div className="min-h-32 animate-pulse rounded-xl bg-muted" />
      </div>
      <div className="h-80 animate-pulse rounded-xl bg-muted" />
      <div className="h-48 animate-pulse rounded-xl bg-muted" />
    </div>
  );
}

export function AnalyticsPageClient() {
  const [range, setRange] = useState<AnalyticsRangeKey>("7d");
  return (
    <section className="container mx-auto max-w-3xl">
      <div className="flex flex-col gap-6">
        <header className="flex flex-row items-center justify-between gap-4">
          <h1 className="text-3xl font-semibold">Analytics</h1>
          <Select
            value={range}
            onValueChange={(value) => {
              setRange(value as AnalyticsRangeKey);
            }}
          >
            <SelectTrigger
              size="default"
              className="mt-1 h-10! w-36 border-0 bg-background text-base font-semibold shadow-float"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {analyticsRanges.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </header>

        <AnalyticsSummaryQuery range={range} />
      </div>
    </section>
  );
}
