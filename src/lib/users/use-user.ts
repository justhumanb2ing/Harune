"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/react-query/query-keys";
import { meQueryOptions } from "@/lib/users/queries";

const useUser = () => {
  const queryClient = useQueryClient();
  const { data, error, isPending } = useQuery(meQueryOptions());

  return {
    user: data?.user,
    profilePage: data?.profilePage,
    isLoading: isPending,
    error,
    mutate: () => queryClient.invalidateQueries({ queryKey: queryKeys.app.me() }),
  };
};

export default useUser;
