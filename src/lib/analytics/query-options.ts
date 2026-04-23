"use client";

import type { ProfileAnalyticsResponse } from "@/lib/analytics/types";
import { apiFetch } from "@/lib/react-query/fetcher";
import { queryKeys } from "@/lib/react-query/query-keys";
import { queryOptions } from "@tanstack/react-query";

export const profileAnalyticsQueryOptions = (timezone: string) =>
  queryOptions({
    queryKey: queryKeys.app.profileAnalytics(timezone),
    queryFn: ({ signal }) =>
      apiFetch<ProfileAnalyticsResponse>(
        ["/api/app/analytics", new URLSearchParams({ timezone }).toString()],
        { signal }
      ),
    refetchOnWindowFocus: false,
    staleTime: 60_000,
  });
