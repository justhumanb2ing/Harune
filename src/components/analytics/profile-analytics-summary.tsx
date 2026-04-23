import type { AnalyticsRangeKey } from "@/lib/analytics/analytics-ranges";
import type {
  ProfileAnalyticsResponse,
  ProfileAnalyticsSummary as ProfileAnalyticsSummaryData,
} from "@/lib/analytics/types";

const metricDefinitions = [
  {
    description: "고정된 page id 기준 조회 이벤트 수",
    key: "pageViews",
    label: "Views",
  },
  {
    description: "소셜 + 링크 아이템 클릭 합계",
    key: "itemClicks",
    label: "Clicks",
  },
  {
    description: "아이템 클릭 수 / 페이지 뷰",
    key: "ctr",
    label: "CTR",
  },
  {
    description: "소셜 링크 클릭 이벤트 수",
    key: "socialClicks",
    label: "Social Clicks",
  },
  {
    description: "일반 링크 카드 클릭 이벤트 수",
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
