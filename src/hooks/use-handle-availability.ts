"use client";

import { useDebounce } from "@/hooks/use-debounce";
import {
  getCheckHandleAvailabilityQueryKey,
  useCheckHandleAvailability,
} from "@/lib/api/generated/http/handle-api/handle-api";
import { normalizeHandle, validateHandle } from "@/lib/handles";

export function useHandleAvailability(handle: string) {
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
  const availabilityError =
    hasResolvedCurrentHandle && availabilityQuery.error
      ? availabilityQuery.error.error.message || "Could not check handle availability."
      : null;
  const isHandleAvailable =
    hasResolvedCurrentHandle &&
    availabilityQuery.data?.status === 200 &&
    availabilityQuery.data.data.available === true &&
    !availabilityError;
  const isHandleTaken =
    hasResolvedCurrentHandle &&
    (availabilityQuery.data?.status === 200
      ? availabilityQuery.data.data.available === false
      : !!availabilityError);

  return {
    availabilityError,
    isCheckingAvailability,
    isHandleAvailable,
    isHandleTaken,
  };
}
