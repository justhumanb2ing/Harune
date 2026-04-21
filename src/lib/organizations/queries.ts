"use client";

import type { UserOrganizationWithPlan } from "@/lib/organizations/types";
import { apiFetch } from "@/lib/react-query/fetcher";
import { queryKeys } from "@/lib/react-query/query-keys";
import { queryOptions } from "@tanstack/react-query";

type OrganizationsResponse = {
  organizations: UserOrganizationWithPlan[];
};

type ActiveOrganizationResponse = {
  organization: UserOrganizationWithPlan | null;
};

export const organizationsQueryOptions = () =>
  queryOptions({
    queryKey: queryKeys.app.organizations(),
    queryFn: ({ signal }) => apiFetch<OrganizationsResponse>("/api/app/org/list", { signal }),
  });

export const activeOrganizationQueryOptions = () =>
  queryOptions({
    queryKey: queryKeys.app.activeOrganization(),
    queryFn: ({ signal }) =>
      apiFetch<ActiveOrganizationResponse>("/api/app/org/active", { signal }),
  });
