"use client";

import { queryOptions } from "@tanstack/react-query";
import type { ProfileAnalyticsResponse } from "@/lib/analytics/types";
import { getMeAnalytics } from "@/lib/api/generated/http/me-api/me-api";
import { queryKeys } from "@/lib/react-query/query-keys";

export const profileAnalyticsQueryOptions = () =>
  queryOptions({
    queryKey: queryKeys.app.profileAnalytics(),
    queryFn: ({ signal }) =>
      getMeAnalytics({ signal }).then((response) => response.data as ProfileAnalyticsResponse),
    refetchOnWindowFocus: false,
    staleTime: 60_000,
  });
