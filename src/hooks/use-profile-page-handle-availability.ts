"use client";

import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "@/hooks/use-debounce";
import { normalizeHandle, validateHandle } from "@/lib/handles";
import { type ApiError, apiFetch } from "@/lib/react-query/fetcher";

type HandleAvailabilityResponse = {
  available: boolean;
};

export function useProfilePageHandleAvailability(handle: string) {
  const normalizedHandle = normalizeHandle(handle);
  const debouncedHandle = useDebounce(normalizedHandle, 500);
  const validationError = validateHandle(normalizedHandle);

  const availabilityQuery = useQuery<HandleAvailabilityResponse, ApiError>({
    queryKey: ["profile-page", "handle-availability", debouncedHandle],
    queryFn: ({ signal }) => {
      const searchParams = new URLSearchParams({ handle: debouncedHandle });
      return apiFetch(`/api/app/profile-page/handle-availability?${searchParams.toString()}`, {
        signal,
      });
    },
    enabled: !!debouncedHandle && !validationError,
    staleTime: 30_000,
    retry: false,
  });

  const isDebouncing = normalizedHandle !== debouncedHandle;
  const hasResolvedCurrentHandle = !isDebouncing;
  const isCheckingAvailability =
    !!normalizedHandle && !validationError && (isDebouncing || availabilityQuery.isFetching);
  const hasAvailabilityError = hasResolvedCurrentHandle && !!availabilityQuery.error;

  return {
    isCheckingAvailability,
    isHandleAvailable:
      hasResolvedCurrentHandle &&
      availabilityQuery.data?.available === true &&
      !hasAvailabilityError,
    isHandleTaken:
      !!validationError ||
      (hasResolvedCurrentHandle &&
        (availabilityQuery.data?.available === false || hasAvailabilityError)),
    shouldShowState: !!normalizedHandle,
  };
}
