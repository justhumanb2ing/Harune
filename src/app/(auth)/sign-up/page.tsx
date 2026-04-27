import { auth } from "@/auth";
import { AuthForm } from "@/components/auth/auth-form";
import PolicyBox from "@/components/auth/policy-box";
import { env } from "@/env";
import { resolveAuthenticatedAppRedirect } from "@/lib/auth/app-redirect";
import { appConfig } from "@/lib/config";
import { SsgoiTransition } from "@ssgoi/react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Sign Up",
  description: `Create your ${appConfig.projectName} account`,
};

type SignUpPageProps = {
  searchParams: Promise<{
    callbackUrl?: string;
    handle?: string;
  }>;
};

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const session = await auth();
  const { callbackUrl, handle } = await searchParams;

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

  const resolvedCallbackUrl = `/post-sign-in${
    redirectTarget.toString() ? `?${redirectTarget.toString()}` : ""
  }`;

  return (
    <SsgoiTransition id="/sign-up" className="block h-full">
      <section className="h-full flex flex-col justify-between px-6 py-6">
        <div className="flex min-h-0 flex-1 items-center justify-center">
          <article className="w-full max-w-lg flex flex-col gap-8">
            <div className="mb-12">
              <h1 className="text-4xl font-semibold tracking-tight mb-2">
                Join {appConfig.projectName}
              </h1>
              <h2>Create your account for free!</h2>
            </div>

            <AuthForm
              mode="sign-up"
              callbackUrl={resolvedCallbackUrl}
              enableGoogle={!!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET)}
            />
          </article>
        </div>
        <PolicyBox />
      </section>
    </SsgoiTransition>
  );
}
