import "server-only";

import { queryKeys } from "@/lib/react-query/query-keys";
import { getMeForUser } from "@/lib/users/me";
import { ME_GC_TIME_MS, ME_STALE_TIME_MS } from "@/lib/users/query-policy";
import { queryOptions } from "@tanstack/react-query";

export const meServerQueryOptions = (userId: string) =>
  queryOptions({
    gcTime: ME_GC_TIME_MS,
    queryFn: () => getMeForUser(userId),
    queryKey: queryKeys.app.me(),
    staleTime: ME_STALE_TIME_MS,
  });
