"use client";

import { queryKeys } from "@/lib/react-query/query-keys";
import { meQueryOptions } from "@/lib/users/queries";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const useCredits = () => {
  const queryClient = useQueryClient();
  const { data, error, isPending } = useQuery(meQueryOptions());

  return {
    credits: data?.user.credits,
    isLoading: isPending,
    error,
    mutate: () => queryClient.invalidateQueries({ queryKey: queryKeys.app.me() }),
  };
};

export default useCredits;
