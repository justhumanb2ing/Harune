import { AuthForm } from "@/components/auth/auth-form";
import { env } from "@/env";
import { appConfig } from "@/lib/config";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Sign In",
  description: `Sign in to your ${appConfig.projectName} account`,
};

export default function SignInPage() {
  const enableGoogleSignIn = true;
  const enableGithubSignIn = Boolean(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET);

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight mb-2">Welcome back</h1>
        <p className="text-sm text-muted-foreground">Sign in to your account to continue</p>
      </div>

      <AuthForm enableGoogleSignIn={enableGoogleSignIn} enableGithubSignIn={enableGithubSignIn} />

      <div className="mt-6 text-center">
        <Link
          href="/sign-up"
          className="text-sm text-primary hover:text-primary/90 underline underline-offset-4"
        >
          Don&apos;t have an account? Sign up
        </Link>
      </div>
    </>
  );
}
