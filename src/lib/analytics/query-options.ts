"use client";

import { queryOptions } from "@tanstack/react-query";
import type { ProfileAnalyticsResponse } from "@/lib/analytics/types";
import { getGetMeAnalyticsQueryOptions } from "@/lib/api/generated/http/me-api/me-api";

export const profileAnalyticsQueryOptions = () =>
  queryOptions({
    ...getGetMeAnalyticsQueryOptions({
      query: {
        refetchOnWindowFocus: false,
        select: (response) => response.data as ProfileAnalyticsResponse,
        staleTime: 60_000,
      },
    }),
  });
