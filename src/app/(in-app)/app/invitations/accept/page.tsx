"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export default function AcceptInvitationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const invitationId = searchParams.get("id");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInvitation = async (action: "accept" | "reject") => {
    if (!invitationId) {
      toast.error("유효하지 않은 초대 링크입니다.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (action === "accept") {
        const { error } = await authClient.organization.acceptInvitation({
          invitationId,
        });

        if (error) {
          throw new Error(error.message ?? "초대 수락에 실패했습니다.");
        }

        toast.success("조직 초대를 수락했습니다.");
      } else {
        const { error } = await authClient.organization.rejectInvitation({
          invitationId,
        });

        if (error) {
          throw new Error(error.message ?? "초대 거절에 실패했습니다.");
        }

        toast.success("조직 초대를 거절했습니다.");
      }

      router.push("/app");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "요청 처리에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl py-12">
      <Card>
        <CardHeader>
          <CardTitle>조직 초대 확인</CardTitle>
          <CardDescription>
            초대된 조직에 참여하거나 초대를 거절할 수 있습니다.
            <br />
            초대 ID: {invitationId ?? "없음"}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-3">
          <Button
            disabled={!invitationId || isSubmitting}
            onClick={() => void handleInvitation("accept")}
          >
            초대 수락
          </Button>
          <Button
            variant="outline"
            disabled={!invitationId || isSubmitting}
            onClick={() => void handleInvitation("reject")}
          >
            초대 거절
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
