"use client";

import type { MeResponse } from "@/lib/api/app/types";
import { getGetMeQueryOptions } from "@/lib/api/generated/http/me-api/me-api";
import { queryKeys } from "@/lib/react-query/query-keys";
import { ME_GC_TIME_MS, ME_STALE_TIME_MS } from "@/lib/users/query-policy";

export const meQueryOptions = () =>
  getGetMeQueryOptions({
    query: {
      gcTime: ME_GC_TIME_MS,
      queryKey: queryKeys.app.me(),
      select: (response) => response.data as MeResponse,
      staleTime: ME_STALE_TIME_MS,
    },
  });
