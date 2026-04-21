"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";

type OnboardingFailProps = {
  handle?: string;
};

export function OnboardingFail({ handle }: OnboardingFailProps) {
  const retryHref = handle ? `/onboarding?handle=${encodeURIComponent(handle)}` : "/onboarding";

  return (
    <div className="mx-auto flex h-full max-w-5xl flex-col gap-4 py-6">
      <header>
        <h2 className="text-center text-sm font-medium uppercase">Failed</h2>
      </header>

      <div className="flex-1 px-8 pb-8">
        <div className="grid min-h-[32rem] gap-10 pt-20 md:grid-cols-2">
          <div />

          <div className="flex flex-col justify-center gap-6">
            <h1 className="text-4xl font-semibold tracking-tight">Failed to create your page</h1>
            <p className="text-muted-foreground text-base">
              Something went wrong while creating your page. Please try again.
            </p>

            <Button asChild size="lg" className="h-12 rounded-xl px-5 text-sm uppercase">
              <Link href={retryHref}>Try again</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
