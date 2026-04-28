"use client";

import type { QueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/react-query/query-keys";

export function clearAuthenticatedAppQueries(queryClient: QueryClient) {
  queryClient.removeQueries({ queryKey: queryKeys.app.all() });
}

export async function invalidateAuthenticatedAppQueries(queryClient: QueryClient) {
  await queryClient.invalidateQueries({ queryKey: queryKeys.app.all() });
}
