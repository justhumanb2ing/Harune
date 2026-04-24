import { appConfig } from "@/lib/config";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-lvh flex flex-col bg-background py-4 px-4">
      <header>
        <Link href={"/"}>
          <Image
            src="/assets/logo.jpeg"
            alt={appConfig.projectName}
            width={48}
            height={48}
            className="mb-4 rounded-xl"
          />
        </Link>
      </header>
      <div className="w-full space-y-8 flex-1 max-w-md justify-center flex flex-col mx-auto">
        <div className="bg-background py-8 px-4">{children}</div>

        {/* <p className="text-center text-xs text-muted-foreground">
          By continuing, you agree to our{" "}
          <Link
            href="/terms"
            className="font-medium text-primary hover:text-primary/90 underline underline-offset-4"
          >
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link
            href="/privacy"
            className="font-medium text-primary hover:text-primary/90 underline underline-offset-4"
          >
            Privacy Policy
          </Link>
        </p> */}
      </div>
    </div>
  );
}
