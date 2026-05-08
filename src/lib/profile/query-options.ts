"use client";

import { queryOptions } from "@tanstack/react-query";
import { getGetProfileByHandleUrl } from "@/lib/api/generated/http/profile-api/profile-api";
import type { GetProfileByHandle200 } from "@/lib/api/generated/http/schemas/profile-api";
import { toProfilePageEditorDataFromPublicPage } from "@/lib/profile/public-profile-page";
import { apiFetch } from "@/lib/react-query/fetcher";
import { queryKeys } from "@/lib/react-query/query-keys";

export const profilePageQueryOptions = (handle: string) =>
  queryOptions({
    queryKey: queryKeys.app.profilePage(handle),
    queryFn: ({ signal }) =>
      apiFetch<GetProfileByHandle200>(getGetProfileByHandleUrl(handle), {
        cache: "no-store",
        signal,
      }).then((data) => toProfilePageEditorDataFromPublicPage(data.page)),
  });
