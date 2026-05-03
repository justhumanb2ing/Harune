"use client";

import { queryOptions } from "@tanstack/react-query";
import type { ProfileAnalyticsResponse } from "@/lib/analytics/types";
import { apiFetch } from "@/lib/react-query/fetcher";
import { queryKeys } from "@/lib/react-query/query-keys";

export const profileAnalyticsQueryOptions = () =>
  queryOptions({
    queryKey: queryKeys.app.profileAnalytics(),
    queryFn: ({ signal }) => apiFetch<ProfileAnalyticsResponse>("/api/analytics", { signal }),
    refetchOnWindowFocus: false,
    staleTime: 60_000,
  });
