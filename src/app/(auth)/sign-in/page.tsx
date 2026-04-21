import { AuthForm } from "@/components/auth/auth-form";
import { env } from "@/env";
import { appConfig } from "@/lib/config";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Sign In",
  description: `Sign in to your ${appConfig.projectName} account`,
};

type SignInPageProps = {
  searchParams: Promise<{
    callbackUrl?: string;
    handle?: string;
  }>;
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const enableGoogleSignIn = true;
  const enableGithubSignIn = Boolean(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET);
  const { callbackUrl, handle } = await searchParams;
  const redirectTarget = new URLSearchParams();

  if (callbackUrl) {
    redirectTarget.set("next", callbackUrl);
  }

  if (handle) {
    redirectTarget.set("handle", handle);
  }

  const resolvedCallbackUrl = `/post-sign-in${
    redirectTarget.toString() ? `?${redirectTarget.toString()}` : ""
  }`;

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight mb-2">Welcome back</h1>
        <p className="text-sm text-muted-foreground">Sign in to your account to continue</p>
      </div>

      <AuthForm
        callbackUrl={resolvedCallbackUrl}
        enableGoogleSignIn={enableGoogleSignIn}
        enableGithubSignIn={enableGithubSignIn}
      />

      <div className="mt-6 text-center">
        <p className="text-center text-xs text-muted-foreground">
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
        </p>
      </div>
    </>
  );
}
