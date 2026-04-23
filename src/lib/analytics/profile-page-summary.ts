import {
  ANALYTICS_RANGE_KEYS,
  type AnalyticsRangeWindow,
  getAnalyticsRangeWindows,
} from "@/lib/analytics/analytics-ranges";
import {
  PROFILE_PAGE_ANALYTICS_EVENT_NAMES,
  buildProfilePageAnalyticsPath,
} from "@/lib/analytics/profile-page";
import type {
  ProfileAnalyticsResponse,
  ProfileAnalyticsSummary,
  ProfileAnalyticsSummaryMap,
} from "@/lib/analytics/types";
import { fetchUmamiEventSeries, getUmamiReportingConfig } from "@/lib/analytics/umami-client";

type UmamiSeriesRow = {
  t: string;
  x: string;
  y: number;
};

const roundCtr = (value: number) => Math.round(value);

export const createEmptyProfileAnalyticsSummary = (
  window: AnalyticsRangeWindow
): ProfileAnalyticsSummary => ({
  ...window,
  ctr: 0,
  itemClicks: 0,
  linkClicks: 0,
  pageViews: 0,
  socialClicks: 0,
});

export const createEmptyProfileAnalyticsSummaryMap = (options?: {
  now?: Date;
  timezone?: string | null;
}): ProfileAnalyticsSummaryMap => {
  const windows = getAnalyticsRangeWindows(options);

  return {
    "7d": createEmptyProfileAnalyticsSummary(windows["7d"]),
    "30d": createEmptyProfileAnalyticsSummary(windows["30d"]),
    today: createEmptyProfileAnalyticsSummary(windows.today),
  };
};

const sumEventRows = (rows: UmamiSeriesRow[], eventName: string) =>
  rows.reduce((total, row) => (row.x === eventName ? total + row.y : total), 0);

const isRowInWindow = (row: UmamiSeriesRow, window: AnalyticsRangeWindow) => {
  const timestamp = Date.parse(row.t);

  return Number.isFinite(timestamp) && timestamp >= window.startAt && timestamp <= window.endAt;
};

export const buildProfileAnalyticsSummary = (
  window: AnalyticsRangeWindow,
  rows: UmamiSeriesRow[]
): ProfileAnalyticsSummary => {
  const rowsInWindow = rows.filter((row) => isRowInWindow(row, window));
  const pageViews = sumEventRows(rowsInWindow, PROFILE_PAGE_ANALYTICS_EVENT_NAMES.pageView);
  const socialClicks = sumEventRows(rowsInWindow, PROFILE_PAGE_ANALYTICS_EVENT_NAMES.socialClick);
  const linkClicks = sumEventRows(rowsInWindow, PROFILE_PAGE_ANALYTICS_EVENT_NAMES.linkClick);
  const itemClicks = socialClicks + linkClicks;
  const ctr = pageViews > 0 ? roundCtr((itemClicks / pageViews) * 100) : 0;

  return {
    ...window,
    ctr,
    itemClicks,
    linkClicks,
    pageViews,
    socialClicks,
  };
};

export const getProfileAnalyticsSummaryMap = async (options: {
  now?: Date;
  profilePageId: string;
  timezone?: string | null;
}): Promise<ProfileAnalyticsSummaryMap> => {
  const windows = getAnalyticsRangeWindows(options);
  const analyticsPath = buildProfilePageAnalyticsPath(options.profilePageId);
  const sourceWindow = windows["30d"];
  const rows = await fetchUmamiEventSeries({
    endAt: sourceWindow.endAt,
    path: analyticsPath,
    startAt: sourceWindow.startAt,
    timezone: sourceWindow.timezone,
    unit: "hour",
  });

  const summaries = ANALYTICS_RANGE_KEYS.map((range) => {
    const window = windows[range];

    return [range, buildProfileAnalyticsSummary(window, rows)] as const;
  });

  return Object.fromEntries(summaries) as ProfileAnalyticsSummaryMap;
};

export const getProfileAnalyticsResponse = async (options: {
  now?: Date;
  profilePageId: string | null;
  timezone?: string | null;
}): Promise<ProfileAnalyticsResponse> => {
  const summaries = createEmptyProfileAnalyticsSummaryMap(options);
  const timezone = summaries.today.timezone;

  if (!options.profilePageId) {
    return {
      profilePageId: null,
      state: "no-profile-page",
      summaries,
      timezone,
    };
  }

  if (!getUmamiReportingConfig()) {
    return {
      profilePageId: null,
      state: "disabled",
      summaries,
      timezone,
    };
  }

  return {
    profilePageId: options.profilePageId,
    state: "ready",
    summaries: await getProfileAnalyticsSummaryMap({
      now: options.now,
      profilePageId: options.profilePageId,
      timezone,
    }),
    timezone,
  };
};
