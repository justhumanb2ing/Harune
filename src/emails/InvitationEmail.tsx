import { appConfig } from "@/lib/config";
import { Button } from "@react-email/button";
import { Html } from "@react-email/html";
import { Text } from "@react-email/text";
import { formatDistanceToNow } from "date-fns";
import * as React from "react";
import Layout from "./components/Layout";

interface InvitationEmailProps {
  organizationName: string;
  inviterName: string;
  role: string;
  inviteUrl: string;
  expiresAt: Date;
}

export default function InvitationEmail({
  organizationName,
  inviterName,
  role,
  inviteUrl,
  expiresAt,
}: InvitationEmailProps) {
  return (
    <Html>
      <Layout previewText={`${organizationName} 워크스페이스 초대가 도착했어요`}>
        <Text>안녕하세요! 👋</Text>
        <Text>
          <strong>{inviterName}</strong>님이 {appConfig.projectName}의{" "}
          <strong>{organizationName}</strong> 조직에 <strong>{role}</strong> 권한으로 초대했습니다.
        </Text>
        <Button
          href={inviteUrl}
          className="bg-primary text-primary-foreground rounded-md py-2 px-4 mt-4"
        >
          초대 수락하기
        </Button>
        <Text className="text-muted text-[14px] mt-4">
          이 초대 링크는 {formatDistanceToNow(expiresAt, { addSuffix: true })} 만료됩니다.
        </Text>
      </Layout>
    </Html>
  );
}
