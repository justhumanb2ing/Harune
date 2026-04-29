import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Tailwind,
  Text,
} from "@react-email/components";
import type * as React from "react";
import { env } from "@/env";
import { appConfig } from "@/lib/config";

interface LayoutProps {
  children: React.ReactNode;
  previewText?: string;
}

const baseUrl = (env.NEXT_PUBLIC_APP_URL ?? appConfig.url).replace(/\/$/, "");

export const Layout = ({ children, previewText }: LayoutProps) => {
  return (
    <Html>
      <Head />
      <Preview>{previewText || ""}</Preview>
      <Tailwind
        config={{
          theme: {
            extend: {
              colors: {
                // TODO: Change this to the correct color
                primary: "#f97316",
                background: "#f9fafb",
                foreground: "#111827",
                border: "#e5e7eb",
                muted: "#9ca3af",
                "primary-foreground": "#f8fafc",
              },
            },
          },
        }}
      >
        <Body className="bg-background my-auto mx-auto font-sans">
          <Container className="border border-solid border-border rounded my-[40px] mx-auto p-[20px] max-w-[465px]">
            <div className="flex justify-center items-center">
              <Img
                src={`${baseUrl}/icon.png`}
                width="20"
                height="20"
                alt={`${appConfig.projectName} Logo`}
                className="my-0 mx-0"
              />
              <Text className="text-foreground ">{appConfig.projectName}</Text>
            </div>
            {children}
            <Hr className="border border-solid border-border my-[26px] mx-0 w-full" />
            <Img
              src={`${baseUrl}/icon.png`}
              width="20"
              height="20"
              alt={`${appConfig.projectName} Logo`}
              className="my-0 mx-0"
            />
            <Text className="text-muted text-[11px] leading-[24px]">
              This email was sent to you by {appConfig.projectName}.
              <br />
              Registered Office: {appConfig.legal.address.street}, {appConfig.legal.address.city},{" "}
              {appConfig.legal.address.state}, {appConfig.legal.address.postalCode},{" "}
              {appConfig.legal.address.country}
              <br />
              If you have any questions, feel free to reach out to us at{" "}
              <Link className="text-primary-400" href={`mailto:${appConfig.legal.email}`}>
                {appConfig.legal.email}
              </Link>
              .
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default Layout;
