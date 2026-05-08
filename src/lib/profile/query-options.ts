"use client";

import { queryOptions } from "@tanstack/react-query";
import {
  getGetProfileByHandleQueryKey,
  getProfileByHandle,
} from "@/lib/api/generated/http/profile-api/profile-api";
import { toProfilePageEditorDataFromPublicPage } from "@/lib/profile/public-profile-page";

export const profilePageQueryOptions = (handle: string) =>
  queryOptions({
    queryKey: getGetProfileByHandleQueryKey(handle),
    enabled: !!handle,
    staleTime: 0,
    queryFn: async ({ signal }) => {
      const response = await getProfileByHandle(handle, {
        cache: "no-store",
        signal,
      });

      if (response.status !== 200) {
        throw new Error("Failed to load profile page.");
      }

      return toProfilePageEditorDataFromPublicPage(response.data.page);
    },
  });
