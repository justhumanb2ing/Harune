import type { AnalyticsRangeKey, AnalyticsRangeWindow } from "@/lib/analytics/analytics-ranges";

export type ProfileAnalyticsSummary = AnalyticsRangeWindow & {
  ctr: number;
  itemClicks: number;
  linkClicks: number;
  pageViews: number;
  socialClicks: number;
};

export type ProfileAnalyticsSummaryMap = Record<AnalyticsRangeKey, ProfileAnalyticsSummary>;

export type ProfileAnalyticsResponse =
  | {
      profilePageId: null;
      state: "disabled";
      summaries: ProfileAnalyticsSummaryMap;
      timezone: string;
    }
  | {
      profilePageId: null;
      state: "no-profile-page";
      summaries: ProfileAnalyticsSummaryMap;
      timezone: string;
    }
  | {
      profilePageId: string;
      state: "ready";
      summaries: ProfileAnalyticsSummaryMap;
      timezone: string;
    };
