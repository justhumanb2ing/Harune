"use client";

import { useState } from "react";
import { ProfileAnalyticsSummary } from "@/components/profile/layout/profile-analytics-summary";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AnalyticsRangeKey } from "@/lib/analytics/analytics-ranges";
import type {
  ProfileAnalyticsResponse,
  ProfileAnalyticsSummary as ProfileAnalyticsSummaryData,
} from "@/lib/analytics/types";
import { useGetMeAnalytics } from "@/lib/api/generated/http/me-api/me-api";
import type { GetMeAnalytics200 } from "@/lib/api/generated/http/schemas/me-api";

const analyticsRanges: Array<{ label: string; value: AnalyticsRangeKey }> = [
  { label: "Today", value: "today" },
  { label: "7 days", value: "7d" },
  { label: "30 days", value: "30d" },
];

const toProfileAnalyticsResponse = (response: GetMeAnalytics200): ProfileAnalyticsResponse => {
  const mapSummary = (summary: GetMeAnalytics200["summaries"][AnalyticsRangeKey]) =>
    ({
      ...summary,
      itemClicks: summary.linkClicks,
      socialClicks: 0,
      changes: {
        ctr: summary.changes.ctr,
        itemClicks: summary.changes.linkClicks,
        linkClicks: summary.changes.linkClicks,
        pageViews: summary.changes.pageViews,
        socialClicks: {
          absolute: 0,
          direction: "flat",
          percent: null,
          previous: 0,
        },
      },
      previous: {
        ...summary.previous,
        itemClicks: summary.previous.linkClicks,
        socialClicks: 0,
      },
      series: summary.series.map((point) => ({
        ...point,
        itemClicks: point.linkClicks,
        socialClicks: 0,
      })),
    }) as ProfileAnalyticsSummaryData;

  return {
    ...response,
    summaries: {
      today: mapSummary(response.summaries.today),
      "7d": mapSummary(response.summaries["7d"]),
      "30d": mapSummary(response.summaries["30d"]),
    },
  };
};

type AnalyticsSummaryQueryProps = {
  range: AnalyticsRangeKey;
};

function AnalyticsSummaryQuery({ range }: AnalyticsSummaryQueryProps) {
  const analyticsQuery = useGetMeAnalytics<ProfileAnalyticsResponse>({
    query: {
      refetchOnWindowFocus: false,
      select: (response) => {
        if (response.status !== 200) {
          throw new Error("Analytics could not be loaded.");
        }

        return toProfileAnalyticsResponse(response.data);
      },
      staleTime: 60_000,
    },
  });

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
