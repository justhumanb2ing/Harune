"use client";

import { ProfileAnalyticsSummary } from "@/components/analytics/profile-analytics-summary";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { AnalyticsRangeKey } from "@/lib/analytics/analytics-ranges";
import { profileAnalyticsQueryOptions } from "@/lib/analytics/query-options";
import { useQuery } from "@tanstack/react-query";
import { Loader2Icon } from "lucide-react";

const analyticsTabs: Array<{ label: string; value: AnalyticsRangeKey }> = [
  { label: "Today", value: "today" },
  { label: "7d", value: "7d" },
  { label: "30d", value: "30d" },
];

export function AnalyticsPageClient() {
  const analyticsQuery = useQuery(profileAnalyticsQueryOptions());

  if (analyticsQuery.isPending) {
    return (
      <section className="container mx-auto flex min-h-40 max-w-md flex-1 items-center justify-center">
        <Loader2Icon className="size-5 animate-spin" />
      </section>
    );
  }

  if (!analyticsQuery.data) {
    return null;
  }

  return (
    <section className="max-w-md mx-auto container">
      <Tabs defaultValue="today" className="gap-6">
        <TabsList className="grid w-full max-w-60 grid-cols-3 bg-transparent p-0 dark:bg-transparent">
          {analyticsTabs.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="w-full rounded-full border-b border-transparent px-0 data-active:bg-primary data-active:text-primary-foreground data-active:shadow-none data-active:after:opacity-0 data-active:hover:text-primary-foreground dark:data-active:bg-transparent dark:data-active:text-black"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {analyticsTabs.map((tab) => (
          <TabsContent key={tab.value} value={tab.value}>
            <ProfileAnalyticsSummary range={tab.value} response={analyticsQuery.data} />
          </TabsContent>
        ))}
      </Tabs>
    </section>
  );
}
