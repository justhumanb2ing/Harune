"use client";

import { useQueryClient } from "@tanstack/react-query";
import type { getMeResponse } from "@/lib/api/generated/http/me-api/me-api";
import { getGetMeQueryKey, useGetMe } from "@/lib/api/generated/http/me-api/me-api";
import type { GetMe200 } from "@/lib/api/generated/http/schemas/me-api";
import { ME_GC_TIME_MS, ME_STALE_TIME_MS } from "@/lib/users/query-policy";

const useUser = (initialData?: GetMe200 | null) => {
  const queryClient = useQueryClient();
  const initialQueryData = initialData
    ? ({
        status: 200,
        data: initialData,
        headers: new Headers(),
      } satisfies getMeResponse)
    : undefined;
  const { data, error, isPending } = useGetMe<GetMe200>({
    query: {
      ...(initialQueryData ? { initialData: initialQueryData } : {}),
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
