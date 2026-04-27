"use client";

import { ProfileAnalyticsSummary } from "@/components/analytics/profile-analytics-summary";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AnalyticsRangeKey } from "@/lib/analytics/analytics-ranges";
import { profileAnalyticsQueryOptions } from "@/lib/analytics/query-options";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Loader2Icon } from "lucide-react";
import { Suspense, useState } from "react";

const analyticsRanges: Array<{ label: string; value: AnalyticsRangeKey }> = [
  { label: "Today", value: "today" },
  { label: "7 days", value: "7d" },
  { label: "30 days", value: "30d" },
];

type AnalyticsSummaryQueryProps = {
  range: AnalyticsRangeKey;
};

function AnalyticsSummaryQuery({ range }: AnalyticsSummaryQueryProps) {
  const analyticsQuery = useSuspenseQuery(profileAnalyticsQueryOptions());

  return <ProfileAnalyticsSummary range={range} response={analyticsQuery.data} />;
}

function AnalyticsSummaryFallback() {
  return (
    <div className="flex min-h-40 flex-1 items-center justify-center">
      <Loader2Icon className="size-5 animate-spin" />
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

        <Suspense fallback={<AnalyticsSummaryFallback />}>
          <AnalyticsSummaryQuery range={range} />
        </Suspense>
      </div>
    </section>
  );
}
