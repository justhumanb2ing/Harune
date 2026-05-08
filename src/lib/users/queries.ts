"use client";

import { getGetMeQueryOptions } from "@/lib/api/generated/http/me-api/me-api";
import type { GetMe200 } from "@/lib/api/generated/http/schemas/me-api";
import { ME_GC_TIME_MS, ME_STALE_TIME_MS } from "@/lib/users/query-policy";

export const meQueryOptions = () =>
  getGetMeQueryOptions<GetMe200>({
    query: {
      gcTime: ME_GC_TIME_MS,
      select: (response) => response.data as GetMe200,
      staleTime: ME_STALE_TIME_MS,
    },
  });
