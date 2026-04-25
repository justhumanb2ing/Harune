"use client";

import type { ProfilePageData } from "@/lib/profile-page/types";
import { apiFetch } from "@/lib/react-query/fetcher";
import { queryKeys } from "@/lib/react-query/query-keys";
import { queryOptions } from "@tanstack/react-query";

export const profilePageQueryOptions = () =>
  queryOptions({
    queryKey: queryKeys.app.profilePage(),
    queryFn: ({ signal }) =>
      apiFetch<ProfilePageData | null>("/api/app/profile-page", {
        cache: "no-store",
        signal,
      }),
  });
