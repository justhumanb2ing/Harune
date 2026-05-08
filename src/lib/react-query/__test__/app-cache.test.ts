import { describe, expect, test } from "bun:test";
import { QueryClient } from "@tanstack/react-query";
import { getGetMeQueryKey } from "@/lib/api/generated/http/me-api/me-api";
import { getGetProfileByHandleQueryKey } from "@/lib/api/generated/http/profile-api/profile-api";
import {
  clearAuthenticatedAppQueries,
  invalidateAuthenticatedAppQueries,
} from "@/lib/react-query/app-cache";

describe("authenticated app query cache helpers", () => {
  test("clears all app-scoped queries after sign-out style transitions", () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(getGetMeQueryKey(), { user: { id: "user-1" } });
    queryClient.setQueryData(getGetProfileByHandleQueryKey("demo"), {
      page: { handle: "demo" },
    });

    clearAuthenticatedAppQueries(queryClient);

    expect(queryClient.getQueryData(getGetMeQueryKey())).toBe(undefined);
    expect(queryClient.getQueryData(getGetProfileByHandleQueryKey("demo"))).toBe(undefined);
  });

  test("invalidates all app-scoped queries after auth or onboarding writes", async () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(getGetMeQueryKey(), { user: { id: "user-1" } });

    await invalidateAuthenticatedAppQueries(queryClient);

    expect(queryClient.getQueryState(getGetMeQueryKey())?.isInvalidated).toBe(true);
  });
});
