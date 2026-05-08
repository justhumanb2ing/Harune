"use client";

import { environmentManager, MutationCache, QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const STALE_TIME_MS = 0;

type ToastMessageGetter = (value: {
  data: unknown;
  error: Error | null;
  variables: unknown;
}) => string | undefined;

type ToastMessage = string | ToastMessageGetter;

interface MutationToastConfig {
  success?: ToastMessage;
  error?: ToastMessage;
}

declare module "@tanstack/react-query" {
  interface Register {
    mutationMeta: {
      toast?: MutationToastConfig;
    };
  }
}

const getToastMessage = (
  message: ToastMessage | undefined,
  value: Parameters<ToastMessageGetter>[0]
) => {
  if (typeof message === "function") {
    return message(value);
  }

  return message;
};

export const mutationToasts = {
  couponDeleted: {
    error: "Failed to delete coupon",
  },
  couponExpired: {
    error: "Failed to expire coupon",
  },
  messageDeleted: {
    error: "Failed to delete message",
  },
  messageUpdated: {
    error: "Failed to update message",
  },
  planCreated: {
    success: "Plan created successfully",
    error: "Failed to create plan",
  },
  planUpdated: {
    success: "Plan updated successfully",
    error: "Failed to update plan",
  },
  userCreditsManaged: {
    success: ({ data }) =>
      typeof data === "object" && data !== null && "message" in data
        ? String(data.message)
        : "Credits updated successfully",
    error: ({ error }) => error?.message || "Failed to manage credits",
  },
  userDeleted: {
    success: "User deleted successfully",
    error: "Failed to delete user",
  },
  userPlanUpdated: {
    success: "Plan updated successfully",
    error: "Failed to update plan",
  },
} satisfies Record<string, MutationToastConfig>;

const makeQueryClient = () =>
  new QueryClient({
    mutationCache: new MutationCache({
      onError: (error, variables, _context, mutation) => {
        const message = getToastMessage(mutation.meta?.toast?.error, {
          data: undefined,
          error,
          variables,
        });

        if (message) {
          toast.error(message.replace(/\./g, ""));
        }
      },
      onSuccess: (data, variables, _context, mutation) => {
        const message = getToastMessage(mutation.meta?.toast?.success, {
          data,
          error: null,
          variables,
        });

        if (message) {
          toast.success(message.replace(/\./g, ""));
        }
      },
    }),
    defaultOptions: {
      mutations: {
        retry: false,
      },
      queries: {
        staleTime: STALE_TIME_MS,
      },
    },
  });

let browserQueryClient: QueryClient | undefined;

export const getQueryClient = () => {
  if (environmentManager.isServer()) {
    return makeQueryClient();
  }

  if (!browserQueryClient) browserQueryClient = makeQueryClient();
  return browserQueryClient;
};
