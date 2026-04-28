"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/react-query/query-keys";
import { meQueryOptions } from "@/lib/users/queries";

const useCurrentPlan = () => {
  const queryClient = useQueryClient();
  const { data, error, isPending } = useQuery(meQueryOptions());

  return {
    currentPlan: data?.currentPlan,
    isLoading: isPending,
    error,
    mutate: () => queryClient.invalidateQueries({ queryKey: queryKeys.app.me() }),
  };
};

export default useCurrentPlan;
