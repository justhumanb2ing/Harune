"use client";

import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { AnalyticsRangeKey } from "@/lib/analytics/analytics-ranges";
import type {
  ProfileAnalyticsMetricChange,
  ProfileAnalyticsMetricKey,
  ProfileAnalyticsResponse,
  ProfileAnalyticsSummary as ProfileAnalyticsSummaryData,
} from "@/lib/analytics/types";
import { cn } from "@/lib/utils";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  EyeIcon,
  MousePointerClickIcon,
  PercentIcon,
  TrophyIcon,
} from "lucide-react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

const numberFormatter = new Intl.NumberFormat("en-US");

const chartConfig = {
  itemClicks: {
    color: "#f87171",
    label: "Clicks",
  },
  pageViews: {
    color: "#818cf8",
    label: "Views",
  },
} satisfies ChartConfig;

const metricDefinitions: Array<{
  icon: typeof EyeIcon;
  key: ProfileAnalyticsMetricKey;
  label: string;
}> = [
  {
    icon: EyeIcon,
    key: "pageViews",
    label: "Views",
  },
  {
    icon: MousePointerClickIcon,
    key: "itemClicks",
    label: "Clicks",
  },
  {
    icon: PercentIcon,
    key: "ctr",
    label: "CTR",
  },
];

const formatMetricValue = (
  summary: ProfileAnalyticsSummaryData,
  metric: ProfileAnalyticsMetricKey
) => {
  if (metric === "ctr") {
    return `${summary.ctr}%`;
  }

  return numberFormatter.format(summary[metric]);
};

const formatChange = (metric: ProfileAnalyticsMetricKey, change: ProfileAnalyticsMetricChange) => {
  if (change.direction === "flat") {
    return "-";
  }

  if (change.percent === null) {
    return "New";
  }

  const sign = change.direction === "up" ? "+" : change.direction === "down" ? "-" : "";

  if (metric === "ctr") {
    return `${sign}${Math.abs(change.absolute)}pp`;
  }

  return `${sign}${Math.abs(change.percent)}%`;
};

const formatSeriesLabel = (timestamp: number, range: AnalyticsRangeKey) =>
  new Intl.DateTimeFormat("en-US", {
    day: range === "today" ? undefined : "numeric",
    hour: range === "today" ? "numeric" : undefined,
    month: range === "today" ? undefined : "short",
  }).format(new Date(timestamp));

type MetricCardProps = {
  metric: (typeof metricDefinitions)[number];
  summary: ProfileAnalyticsSummaryData;
};

function MetricCard({ metric, summary }: MetricCardProps) {
  const Icon = metric.icon;
  const change = summary.changes[metric.key];
  const TrendIcon = change.direction === "down" ? ArrowDownIcon : ArrowUpIcon;

  return (
    <div className="grid min-h-28 grid-rows-[1rem_1fr] gap-5 rounded-xl bg-background p-4 shadow-float lg:aspect-square lg:min-h-0">
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs font-medium uppercase">{metric.label}</div>
        <Icon className="size-4" />
      </div>
      <div className="flex flex-col justify-end gap-1">
        <div className="text-4xl font-bold tracking-tight">
          {formatMetricValue(summary, metric.key)}
        </div>
        <div
          className={cn(
            "inline-flex w-fit items-center gap-1 text-xs font-medium",
            change.direction === "up" && " text-green-500",
            change.direction === "down" && " text-red-500",
            change.direction === "flat" && "text-muted-foreground"
          )}
        >
          {formatChange(metric.key, change)}
          {change.direction === "flat" ? null : <TrendIcon className="size-3" />}
        </div>
      </div>
    </div>
  );
}

type ProfileAnalyticsSummaryProps = {
  range: AnalyticsRangeKey;
  response: ProfileAnalyticsResponse;
};

export function ProfileAnalyticsSummary({ range, response }: ProfileAnalyticsSummaryProps) {
  const summary = response.summaries[range];
  const topItem = summary.topItems[0];
  const chartData = summary.series.map((point) => ({
    ...point,
    label: formatSeriesLabel(point.timestamp, range),
  }));

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {metricDefinitions.map((metric) => (
          <MetricCard key={metric.key} metric={metric} summary={summary} />
        ))}

        <div className="flex min-h-32 flex-col justify-between rounded-xl bg-background p-4 shadow-float">
          <div className="flex items-center justify-between gap-3">
            <div className="text-xs font-medium uppercase">Top Item</div>
            <TrophyIcon className="size-4" />
          </div>
          <div className="space-y-2">
            <div className="line-clamp-1 text-2xl font-bold tracking-tight truncate">
              {topItem?.label ?? "No clicks yet"}
            </div>
            <div className="text-xs text-muted-foreground">
              {topItem
                ? `${numberFormatter.format(topItem.clicks)} clicks · ${topItem.share}% share`
                : "Clicks will appear here as visitors engage."}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-background p-4 shadow-float">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold">Views and clicks</h2>
            <p className="text-xs text-muted-foreground">{summary.label}</p>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <span className="size-2 rounded-full bg-indigo-600" />
              Views
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="size-2 rounded-full bg-red-400" />
              Clicks
            </span>
          </div>
        </div>

        {chartData.length > 0 ? (
          <ChartContainer className="h-56 w-full aspect-auto" config={chartConfig}>
            <AreaChart accessibilityLayer data={chartData} margin={{ left: 0, right: 0, top: 8 }}>
              <CartesianGrid vertical={false} />
              <XAxis
                axisLine={false}
                dataKey="label"
                tickLine={false}
                tickMargin={10}
                minTickGap={24}
              />
              <YAxis axisLine={false} tickLine={false} width={28} />
              <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
              <Area
                dataKey="pageViews"
                fill="var(--color-pageViews)"
                fillOpacity={0.16}
                name="Views"
                stroke="var(--color-pageViews)"
                strokeWidth={2}
                type="natural"
              />
              <Area
                dataKey="itemClicks"
                fill="var(--color-itemClicks)"
                fillOpacity={0.12}
                name="Clicks"
                stroke="var(--color-itemClicks)"
                strokeWidth={2}
                type="natural"
              />
            </AreaChart>
          </ChartContainer>
        ) : (
          <div className="flex h-56 items-center justify-center rounded-lg bg-muted/40 text-sm text-muted-foreground">
            No trend data yet
          </div>
        )}
      </div>

      <div className="rounded-xl bg-background p-4 shadow-float">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Top clicked items</h2>
          <span className="text-xs text-muted-foreground">{summary.topItems.length} items</span>
        </div>
        {summary.topItems.length > 0 ? (
          <div className="divide-y divide-border">
            {summary.topItems.map((item) => (
              <div key={`${item.kind}:${item.label}`} className="flex items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <div className="line-clamp-1 text-sm font-medium">{item.label}</div>
                  <div className="text-xs capitalize text-muted-foreground">{item.kind}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold">{numberFormatter.format(item.clicks)}</div>
                  <div className="text-xs text-muted-foreground">
                    {item.changePercent === null
                      ? "New"
                      : `${item.changePercent > 0 ? "+" : ""}${item.changePercent}%`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg bg-muted/40 px-4 py-8 text-center text-sm text-muted-foreground">
            Clicked links and socials will show up here.
          </div>
        )}
      </div>
    </div>
  );
}
