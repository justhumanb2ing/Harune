"use client";

import { useDebounce } from "@/hooks/shared/use-debounce";
import {
  getCheckHandleAvailabilityQueryKey,
  useCheckHandleAvailability,
} from "@/lib/api/generated/http/handle-api/handle-api";
import { normalizeHandle, validateHandle } from "@/lib/profile/handles";

export function useProfilePageHandleAvailability(handle: string) {
  const normalizedHandle = normalizeHandle(handle);
  const debouncedHandle = useDebounce(normalizedHandle, 500);
  const validationError = validateHandle(normalizedHandle);

  const availabilityQuery = useCheckHandleAvailability(
    { handle: debouncedHandle },
    {
      query: {
        enabled: !!debouncedHandle && !validationError,
        queryKey: getCheckHandleAvailabilityQueryKey({ handle: debouncedHandle }),
        retry: false,
        staleTime: 30_000,
      },
    }
  );

  const isDebouncing = normalizedHandle !== debouncedHandle;
  const hasResolvedCurrentHandle = !isDebouncing;
  const isCheckingAvailability =
    !!normalizedHandle && !validationError && (isDebouncing || availabilityQuery.isFetching);
  const hasAvailabilityError = hasResolvedCurrentHandle && !!availabilityQuery.error;
  const isHandleAvailable =
    hasResolvedCurrentHandle &&
    availabilityQuery.data?.status === 200 &&
    availabilityQuery.data.data.available === true &&
    !hasAvailabilityError;
  const isHandleTaken =
    !!validationError ||
    (hasResolvedCurrentHandle &&
      (availabilityQuery.data?.status === 200
        ? availabilityQuery.data.data.available === false
        : hasAvailabilityError));

  return {
    isCheckingAvailability,
    isHandleAvailable,
    isHandleTaken,
    shouldShowState: !!normalizedHandle,
  };
}
