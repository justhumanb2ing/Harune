"use client";

import { queryOptions } from "@tanstack/react-query";
import type { ProfilePageData } from "@/lib/profile-page/types";
import { apiFetch } from "@/lib/react-query/fetcher";
import { queryKeys } from "@/lib/react-query/query-keys";

export const profilePageQueryOptions = (handle: string) =>
  queryOptions({
    queryKey: queryKeys.app.profilePage(handle),
    queryFn: ({ signal }) =>
      apiFetch<ProfilePageData | null>(
        `/api/app/profile-page?handle=${encodeURIComponent(handle)}`,
        {
          cache: "no-store",
          signal,
        }
      ),
  });
