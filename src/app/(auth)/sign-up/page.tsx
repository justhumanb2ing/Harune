import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import PolicyBox from "@/components/auth/policy-box";
import { env } from "@/env";
import { resolveAppEntryHref } from "@/lib/auth/app-entry";
import { getSafeRedirectPath } from "@/lib/auth/app-redirect-paths";
import { appConfig } from "@/lib/config";
import { createPageMetadata } from "@/lib/seo";
import { getServerMe } from "@/lib/users/server-me";

export const metadata: Metadata = createPageMetadata({
  path: "/sign-up",
  title: "Sign Up",
  description: `Create your ${appConfig.projectName} account.`,
});

type SignUpPageProps = {
  searchParams: Promise<{
    callbackUrl?: string;
    handle?: string;
  }>;
};

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const { callbackUrl, handle } = await searchParams;
  const resolvedCallbackPath = getSafeRedirectPath(callbackUrl);
  const me = await getServerMe();

  if (me) {
    redirect(
      resolveAppEntryHref({
        next: resolvedCallbackPath,
        profilePage: me.profilePage,
      })
    );
  }

  const redirectTarget = new URLSearchParams();
  if (handle) {
    redirectTarget.set("handle", handle);
  }

  const resolvedCallbackUrl = `/create${redirectTarget.toString() ? `?${redirectTarget.toString()}` : ""}`;

  return (
    <div className="block h-full">
      <section className="h-full flex flex-col justify-between px-6 py-6">
        <div className="flex min-h-0 flex-1 items-center justify-center">
          <article className="w-full max-w-lg flex flex-col gap-8">
            <div className="mb-12 flex flex-col gap-2">
              <h1 className="text-4xl font-bold tracking-tight mb-2">
                Join {appConfig.projectName}
              </h1>
              <h2 className="text-base text-neutral-600">Create your account for free</h2>
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
    </div>
  );
}
