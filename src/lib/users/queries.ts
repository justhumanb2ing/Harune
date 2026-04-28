"use client";

import { queryOptions } from "@tanstack/react-query";
import type { MeResponse } from "@/app/api/app/me/types";
import { apiFetch } from "@/lib/react-query/fetcher";
import { queryKeys } from "@/lib/react-query/query-keys";
import { ME_GC_TIME_MS, ME_STALE_TIME_MS } from "@/lib/users/query-policy";

export const meQueryOptions = () =>
  queryOptions({
    gcTime: ME_GC_TIME_MS,
    queryKey: queryKeys.app.me(),
    queryFn: ({ signal }) =>
      apiFetch<MeResponse>("/api/app/me", {
        cache: "no-store",
        signal,
      }),
    staleTime: ME_STALE_TIME_MS,
  });
