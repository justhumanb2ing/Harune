"use client";

import { useQueryClient } from "@tanstack/react-query";
import { getGetMeQueryKey, useGetMe } from "@/lib/api/generated/http/me-api/me-api";
import type { GetMe200 } from "@/lib/api/generated/http/schemas/me-api";
import { ME_GC_TIME_MS, ME_STALE_TIME_MS } from "@/lib/users/query-policy";

const useUser = () => {
  const queryClient = useQueryClient();
  const { data, error, isPending } = useGetMe<GetMe200>({
    query: {
      gcTime: ME_GC_TIME_MS,
      select: (response) => {
        if (response.status !== 200) {
          throw new Error("Failed to load user.");
        }

        return response.data;
      },
      staleTime: ME_STALE_TIME_MS,
    },
  });

  return {
    user: data?.user,
    profilePage: data?.profilePage,
    isLoading: isPending,
    error,
    mutate: () => queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() }),
  };
};

export default useUser;
