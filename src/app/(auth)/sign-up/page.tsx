import { AuthForm } from "@/components/auth/auth-form";
import { SignUpForm } from "@/components/auth/signup-form";
import { env } from "@/env";
import { appConfig } from "@/lib/config";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Sign Up",
  description: `Create your ${appConfig.projectName} account`,
};

export default function SignUpPage() {
  const showPasswordAuth = appConfig.auth?.enablePasswordAuth;
  const enableGoogleSignIn = true;
  const enableGithubSignIn = Boolean(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET);

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight mb-2">Create an account</h1>
        <p className="text-sm text-muted-foreground">
          Get started with {appConfig.projectName} today
        </p>
      </div>

      {showPasswordAuth ? (
        <SignUpForm />
      ) : (
        <AuthForm enableGoogleSignIn={enableGoogleSignIn} enableGithubSignIn={enableGithubSignIn} />
      )}

      <div className="mt-6 text-center">
        <Link
          href="/sign-in"
          className="text-sm text-primary hover:text-primary/90 underline underline-offset-4"
        >
          Already have an account? Sign in
        </Link>
      </div>
    </>
  );
}
