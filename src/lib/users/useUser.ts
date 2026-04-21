"use client";

import { queryKeys } from "@/lib/react-query/query-keys";
import { meQueryOptions } from "@/lib/users/queries";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const useUser = () => {
  const queryClient = useQueryClient();
  const { data, error, isPending } = useQuery(meQueryOptions());

  return {
    user: data?.user,
    isLoading: isPending,
    error,
    mutate: () => queryClient.invalidateQueries({ queryKey: queryKeys.app.me() }),
  };
};

export default useUser;
