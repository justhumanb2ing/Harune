import { describe, expect, test } from "bun:test";
import { QueryClient } from "@tanstack/react-query";
import {
  clearAuthenticatedAppQueries,
  invalidateAuthenticatedAppQueries,
} from "@/lib/react-query/app-cache";
import { queryKeys } from "@/lib/react-query/query-keys";

describe("authenticated app query cache helpers", () => {
  test("clears all app-scoped queries after sign-out style transitions", () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(queryKeys.app.me(), { user: { id: "user-1" } });
    queryClient.setQueryData(queryKeys.app.profilePage(), { page: { handle: "demo" } });

    clearAuthenticatedAppQueries(queryClient);

    expect(queryClient.getQueryData(queryKeys.app.me())).toBeUndefined();
    expect(queryClient.getQueryData(queryKeys.app.profilePage())).toBeUndefined();
  });

  test("invalidates all app-scoped queries after auth or onboarding writes", async () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(queryKeys.app.me(), { user: { id: "user-1" } });

    await invalidateAuthenticatedAppQueries(queryClient);

    expect(queryClient.getQueryState(queryKeys.app.me())?.isInvalidated).toBe(true);
  });
});
