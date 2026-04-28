import { SsgoiTransition } from "@ssgoi/react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AuthForm } from "@/components/auth/auth-form";
import PolicyBox from "@/components/auth/policy-box";
import { env } from "@/env";
import { resolveAuthenticatedAppRedirect } from "@/lib/auth/app-redirect";
import { appConfig } from "@/lib/config";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  path: "/sign-in",
  title: "Sign In",
  description: `Sign in to your ${appConfig.projectName} account.`,
});

type SignInPageProps = {
  searchParams: Promise<{
    callbackUrl?: string;
    error?: string;
    error_description?: string;
    handle?: string;
    oauth?: string;
  }>;
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const session = await auth();
  const { callbackUrl, error, error_description, handle, oauth } = await searchParams;

  if (session?.user?.id) {
    redirect(
      await resolveAuthenticatedAppRedirect({
        handle,
        next: callbackUrl,
        userId: session.user.id,
      })
    );
  }

  const redirectTarget = new URLSearchParams();

  if (callbackUrl) {
    redirectTarget.set("next", callbackUrl);
  }

  if (handle) {
    redirectTarget.set("handle", handle);
  }

  const resolvedCallbackUrl = `/api/join${
    redirectTarget.toString() ? `?${redirectTarget.toString()}` : ""
  }`;
  const oauthErrorMessage =
    oauth === "failed" || error
      ? error_description ||
        "Google sign-in was canceled or could not be completed. Please try again."
      : null;

  return (
    <SsgoiTransition id="/sign-in" className="block h-full">
      <section className="h-full flex flex-col justify-between px-6 py-6">
        <div className="flex min-h-0 flex-1 items-center justify-center">
          <article className="w-full max-w-lg flex flex-col gap-8">
            <div className="mb-16">
              <h1 className="text-4xl font-semibold tracking-tight mb-2">Welcome back</h1>
              <h2>We've been waiting for you!</h2>
            </div>

            <AuthForm
              mode="sign-in"
              callbackUrl={resolvedCallbackUrl}
              enableGoogle={!!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET)}
            />

            {oauthErrorMessage ? (
              <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {oauthErrorMessage}
              </div>
            ) : null}
          </article>
        </div>
        <PolicyBox />
      </section>
    </SsgoiTransition>
  );
}
