"use client";

import { queryOptions } from "@tanstack/react-query";
import type { ProfilePageData } from "@/lib/profile/types";
import { apiFetch } from "@/lib/react-query/fetcher";
import { queryKeys } from "@/lib/react-query/query-keys";

export const profilePageQueryOptions = (handle: string) =>
  queryOptions({
    queryKey: queryKeys.app.profilePage(handle),
    queryFn: ({ signal }) =>
      apiFetch<ProfilePageData | null>(`/api/profile?handle=${encodeURIComponent(handle)}`, {
        cache: "no-store",
        signal,
      }),
  });
