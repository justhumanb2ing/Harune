"use client";

import { PlanForm } from "@/components/forms/plan-form";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/react-query/fetcher";
import { mutationToasts } from "@/lib/react-query/query-client";
import { queryKeys } from "@/lib/react-query/query-keys";
import type { PlanFormValues } from "@/lib/validations/plan.schema";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

export default function EditPlanPage() {
  const { id } = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const planId = String(id);
  const { data: plan, error } = useQuery({
    queryKey: queryKeys.superAdmin.plans.detail(planId),
    queryFn: ({ signal }) =>
      apiFetch<PlanFormValues>(`/api/super-admin/plans/${planId}`, { signal }),
    enabled: Boolean(id),
  });

  const updatePlanMutation = useMutation({
    mutationFn: (data: PlanFormValues) =>
      apiFetch("/api/super-admin/plans", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...data, id }),
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.superAdmin.plans.all() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.superAdmin.plans.detail(planId) }),
      ]);
      router.push("/super-admin/plans");
    },
    meta: {
      toast: mutationToasts.planUpdated,
    },
    onError: (error) => {
      console.error("Error updating plan:", error);
    },
  });

  if (error) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-14rem)]">
        <div className="text-center">
          <h2 className="text-lg font-medium">Error loading plan</h2>
          <p className="text-sm text-muted-foreground">
            Failed to load plan details. Please try again.
          </p>
          <Button variant="ghost" size="sm" asChild className="mt-4">
            <Link href="/super-admin/plans">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Plans
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/super-admin/plans">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Edit Plan</h1>
      </div>

      <div className="border rounded-lg p-4">
        {plan ? (
          <PlanForm
            initialData={plan}
            onSubmit={async (data) => {
              await updatePlanMutation.mutateAsync(data);
            }}
            submitLabel="Update Plan"
          />
        ) : (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="text-lg">Loading...</div>
              <div className="text-sm text-muted-foreground">
                Please wait while we load the plan details.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
