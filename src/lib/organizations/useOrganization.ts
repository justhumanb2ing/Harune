"use client";

import { activeOrganizationQueryOptions } from "@/lib/organizations/queries";
import { queryKeys } from "@/lib/react-query/query-keys";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const useOrganization = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data, error, isPending } = useQuery(activeOrganizationQueryOptions());

  const switchOrganization = async (organizationId: string) => {
    const switchPromise = fetch("/api/app/org/active", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ organizationId }),
    }).then(async (response) => {
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "조직 전환에 실패했습니다.");
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.app.activeOrganization() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.app.organizations() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.app.me() }),
      ]);
      router.push("/section");
    });

    await toast.promise(switchPromise, {
      loading: "조직을 전환하는 중입니다...",
      success: "조직이 전환되었습니다.",
      error: (err) => (err instanceof Error ? err.message : "조직 전환에 실패했습니다."),
    });
  };

  return {
    organization: data?.organization,
    isLoading: isPending,
    error,
    mutate: () => queryClient.invalidateQueries({ queryKey: queryKeys.app.activeOrganization() }),
    switchOrganization,
  };
};

export { useOrganization };
