import { appConfig } from "@/lib/config";
import { Button } from "@react-email/button";
import { Html } from "@react-email/html";
import { Text } from "@react-email/text";
import { formatDistanceToNow } from "date-fns";
import * as React from "react";
import Layout from "./components/Layout";

interface ResetPasswordEmailProps {
  url: string;
  expiresAt: Date;
}

export default function ResetPasswordEmail({
  url,
  expiresAt = new Date(Date.now() + 30 * 60 * 1000),
}: ResetPasswordEmailProps) {
  return (
    <Html>
      <Layout previewText={`Reset your ${appConfig.projectName} password 🔐`}>
        <Text>Hello there! 👋</Text>

        <Text>
          We received a request to reset your password for your {appConfig.projectName} account.
          Click the button below to set a new password.
        </Text>

        <Button href={url} className="bg-primary text-primary-foreground rounded-md py-2 px-4 mt-4">
          Reset Password
        </Button>

        <Text className="text-muted text-[14px] mt-4">
          This link will expire {formatDistanceToNow(new Date(expiresAt), { addSuffix: true })}. If
          you didn&apos;t request this email, you can safely ignore it.
        </Text>
      </Layout>
    </Html>
  );
}
