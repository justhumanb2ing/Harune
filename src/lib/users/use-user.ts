"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getGetMeQueryKey } from "@/lib/api/generated/http/me-api/me-api";
import { meQueryOptions } from "@/lib/users/queries";

const useUser = () => {
  const queryClient = useQueryClient();
  const { data, error, isPending } = useQuery(meQueryOptions());

  return {
    user: data?.user,
    profilePage: data?.profilePage,
    isLoading: isPending,
    error,
    mutate: () => queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() }),
  };
};

export default useUser;
