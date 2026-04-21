import { appConfig } from "@/lib/config";
import { Html } from "@react-email/html";
import { Text } from "@react-email/text";
import * as React from "react";
import Layout from "./components/Layout";

interface AccessRevokedEmailProps {
  organizationName: string;
}

export default function AccessRevokedEmail({ organizationName }: AccessRevokedEmailProps) {
  return (
    <Html>
      <Layout previewText={`${organizationName} 조직 접근 권한이 변경되었습니다`}>
        <Text>안녕하세요.</Text>
        <Text>
          {appConfig.projectName}의 <strong>{organizationName}</strong> 조직 접근 권한이
          제거되었습니다.
        </Text>
        <Text className="text-muted text-[14px] mt-4">
          변경 사항에 문의가 필요하면 조직 관리자에게 문의해주세요.
        </Text>
      </Layout>
    </Html>
  );
}
