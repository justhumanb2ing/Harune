import { appConfig } from "@/lib/config";
import { Button } from "@react-email/button";
import { Html } from "@react-email/html";
import { Text } from "@react-email/text";
import { formatDistanceToNow } from "date-fns";
import * as React from "react";
import Layout from "./components/Layout";

interface SignUpEmailProps {
  name: string;
  url: string;
  expiresAt: Date;
}

export default function SignUpEmail({
  name,
  url,
  expiresAt = new Date(Date.now() + 30 * 60 * 1000),
}: SignUpEmailProps) {
  return (
    <Html>
      <Layout previewText={`Complete your ${appConfig.projectName} account setup 🚀`}>
        <Text>Hello {name}! 👋</Text>

        <Text>
          Welcome to {appConfig.projectName}! Click the button below to set your password and
          complete your account setup.
        </Text>

        <Button href={url} className="bg-primary text-primary-foreground rounded-md py-2 px-4 mt-4">
          Set Your Password
        </Button>

        <Text className="text-muted text-[14px] mt-4">
          This link will expire {formatDistanceToNow(new Date(expiresAt), { addSuffix: true })}. If
          you didn&apos;t request this email, you can safely ignore it.
        </Text>
      </Layout>
    </Html>
  );
}
