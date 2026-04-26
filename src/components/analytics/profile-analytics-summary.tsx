import type { AnalyticsRangeKey } from "@/lib/analytics/analytics-ranges";
import type {
  ProfileAnalyticsResponse,
  ProfileAnalyticsSummary as ProfileAnalyticsSummaryData,
} from "@/lib/analytics/types";

const metricDefinitions = [
  {
    description: "View events by stable page id",
    key: "pageViews",
    label: "Views",
  },
  {
    description: "Total social and link item clicks",
    key: "itemClicks",
    label: "Clicks",
  },
  {
    description: "Item clicks divided by page views",
    key: "ctr",
    label: "CTR",
  },
  {
    description: "Social link click events",
    key: "socialClicks",
    label: "Social Clicks",
  },
  {
    description: "Standard link card click events",
    key: "linkClicks",
    label: "Link Clicks",
  },
] as const;

const formatMetricValue = (
  summary: ProfileAnalyticsSummaryData,
  metric: (typeof metricDefinitions)[number]["key"]
) => {
  if (metric === "ctr") {
    return `${summary.ctr}%`;
  }

  return new Intl.NumberFormat("en-US").format(summary[metric]);
};

type ProfileAnalyticsSummaryProps = {
  range: AnalyticsRangeKey;
  response: ProfileAnalyticsResponse;
};

export function ProfileAnalyticsSummary({ range, response }: ProfileAnalyticsSummaryProps) {
  const summary = response.summaries[range];

  return (
    <div className="flex flex-col gap-3">
      {metricDefinitions.map((metric) => (
        <div
          key={metric.key}
          className="flex flex-col gap-0 rounded-lg bg-background p-4 px-5 shadow-brand-small"
        >
          <div className="text-sm capitalize">{metric.label}</div>
          <div className="text-base font-bold tracking-tight">
            {formatMetricValue(summary, metric.key)}
          </div>
        </div>
      ))}
    </div>
  );
}
