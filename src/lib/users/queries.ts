"use client";

import type { MeResponse } from "@/app/api/app/me/types";
import { apiFetch } from "@/lib/react-query/fetcher";
import { queryKeys } from "@/lib/react-query/query-keys";
import { queryOptions } from "@tanstack/react-query";

export const meQueryOptions = () =>
  queryOptions({
    queryKey: queryKeys.app.me(),
    queryFn: ({ signal }) =>
      apiFetch<MeResponse>("/api/app/me", {
        cache: "no-store",
        signal,
      }),
  });
