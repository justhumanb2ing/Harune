"use client";

import { organizationsQueryOptions } from "@/lib/organizations/queries";
import { queryKeys } from "@/lib/react-query/query-keys";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const useOrganizations = () => {
  const queryClient = useQueryClient();
  const { data, error, isPending } = useQuery(organizationsQueryOptions());

  return {
    organizations: data?.organizations ?? [],
    isLoading: isPending,
    error,
    mutate: () => queryClient.invalidateQueries({ queryKey: queryKeys.app.organizations() }),
  };
};

export default useOrganizations;
