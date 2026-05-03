"use client";

import { useQuery } from "@tanstack/react-query";
import type { InferResponseType } from "hono/client";
import { useDebounce } from "@/hooks/use-debounce";
import { rootApiClient } from "@/lib/api/client";
import { normalizeHandle, validateHandle } from "@/lib/handles";
import { ApiError } from "@/lib/react-query/fetcher";
import { queryKeys } from "@/lib/react-query/query-keys";

type HandleAvailabilityResponse = Extract<
  InferResponseType<typeof rootApiClient.api.handle.availability.$get, 200>,
  { available: boolean }
>;

export function useHandleAvailability(handle: string) {
  const normalizedHandle = normalizeHandle(handle);
  const debouncedHandle = useDebounce(normalizedHandle, 500);
  const validationError = validateHandle(normalizedHandle);

  const availabilityQuery = useQuery<HandleAvailabilityResponse, ApiError>({
    queryKey: queryKeys.handles.availability(debouncedHandle),
    queryFn: async ({ signal }) => {
      const response = await rootApiClient.api.handle.availability.$get(
        { query: { handle: debouncedHandle } },
        { init: { signal } }
      );

      if (!response.ok) {
        const body = await response.text();
        const error = new ApiError(body || "Could not check handle availability.");
        error.status = response.status;
        error.body = body;
        throw error;
      }

      return (await response.json()) as HandleAvailabilityResponse;
    },
    enabled: !!debouncedHandle && !validationError,
    staleTime: 30_000,
    retry: false,
  });

  const isDebouncing = normalizedHandle !== debouncedHandle;
  const hasResolvedCurrentHandle = !isDebouncing;
  const isCheckingAvailability =
    !!normalizedHandle && !validationError && (isDebouncing || availabilityQuery.isFetching);
  const availabilityError =
    hasResolvedCurrentHandle && availabilityQuery.error
      ? availabilityQuery.error.message || "Could not check handle availability."
      : null;

  return {
    availabilityError,
    isCheckingAvailability,
    isHandleAvailable:
      hasResolvedCurrentHandle && availabilityQuery.data?.available === true && !availabilityError,
    isHandleTaken:
      hasResolvedCurrentHandle && availabilityQuery.data?.available === false && !availabilityError,
  };
}
