"use client";

import type { QueryClient, QueryKey } from "@tanstack/react-query";
import { getCheckHandleAvailabilityQueryKey } from "@/lib/api/generated/http/handle-api/handle-api";
import {
  getGetMeAnalyticsQueryKey,
  getGetMeQueryKey,
} from "@/lib/api/generated/http/me-api/me-api";
import { getGetProfileByHandleQueryKey } from "@/lib/api/generated/http/profile-api/profile-api";

const authScopedQueryKeyPrefixes = [
  getGetMeQueryKey()[0],
  getGetMeAnalyticsQueryKey()[0],
  getCheckHandleAvailabilityQueryKey({ handle: "" })[0],
  getGetProfileByHandleQueryKey("")[0],
];

const getQueryKeyPrefix = (queryKey: QueryKey) => {
  if (!Array.isArray(queryKey)) {
    return null;
  }

  const [firstKey] = queryKey;

  return typeof firstKey === "string" ? firstKey : null;
};

const isAuthScopedQueryKey = (queryKey: QueryKey) => {
  const keyPrefix = getQueryKeyPrefix(queryKey);

  if (!keyPrefix) {
    return false;
  }

  return authScopedQueryKeyPrefixes.some(
    (prefix) => keyPrefix === prefix || keyPrefix.startsWith(prefix)
  );
};

export function clearAuthenticatedAppQueries(queryClient: QueryClient) {
  queryClient.removeQueries({ predicate: ({ queryKey }) => isAuthScopedQueryKey(queryKey) });
}

export async function invalidateAuthenticatedAppQueries(queryClient: QueryClient) {
  await queryClient.invalidateQueries({
    predicate: ({ queryKey }) => isAuthScopedQueryKey(queryKey),
  });
}
