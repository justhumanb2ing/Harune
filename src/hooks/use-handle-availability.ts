"use client";

import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "@/hooks/use-debounce";
import { normalizeHandle, validateHandle } from "@/lib/handles";
import { type ApiError, apiFetch } from "@/lib/react-query/fetcher";
import { queryKeys } from "@/lib/react-query/query-keys";

type HandleAvailabilityResponse = {
  available: boolean;
};

export function useHandleAvailability(handle: string) {
  const normalizedHandle = normalizeHandle(handle);
  const debouncedHandle = useDebounce(normalizedHandle, 500);
  const validationError = validateHandle(normalizedHandle);

  const availabilityQuery = useQuery<HandleAvailabilityResponse, ApiError>({
    queryKey: queryKeys.handles.availability(debouncedHandle),
    queryFn: ({ signal }) => {
      const searchParams = new URLSearchParams({ handle: debouncedHandle });
      return apiFetch(`/api/handles/availability?${searchParams.toString()}`, { signal });
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
