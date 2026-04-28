"use client";

import { ArrowRightIcon, CheckIcon } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { appConfig } from "@/lib/config";

type OnboardingSuccessProps = {
  handle: string;
};

export function OnboardingSuccess({ handle }: OnboardingSuccessProps) {
  const [isCopied, setIsCopied] = React.useState(false);

  React.useEffect(() => {
    if (!isCopied) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setIsCopied(false);
    }, 2000);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [isCopied]);

  const handleCopyPageUrl = async () => {
    await navigator.clipboard.writeText(`${appConfig.url}/${handle}`);
    setIsCopied(true);
  };

  return (
    <div className="flex h-full flex-col gap-4 py-6 items-center justify-center bg-background">
      <div className="max-w-md mx-auto w-full flex-1 px-4 pb-8">
        <div className="flex flex-col min-h-full gap-32 pt-20 lg:flex-row">
          {/* <div className="flex-4 w-full min-h-full h-full rounded-xl overflow-hidden">
            <Image
              src={"/images/onboarding_sample.jpeg"}
              alt="onboarding_success"
              width={400}
              height={400}
              className="w-full h-[44rem] lg:h-full rounded-xl object-cover"
            />
          </div> */}

          <div className="flex flex-col justify-center gap-12 max-w-full flex-3">
            <header className="flex flex-col gap-2">
              <h1 className="text-3xl font-semibold tracking-tight">Congratulation 🎉</h1>
              <h2>You’re all set — your page is live.</h2>
            </header>

            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between rounded-lg bg-secondary px-5 py-2 pr-2">
                <span className="text-lg font-medium">{`${appConfig.url}/${handle}`.slice(8)}</span>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => void handleCopyPageUrl()}
                  className={"bg-background hover:bg-background shadow-xs min-w-14 font-semibold"}
                  aria-label={isCopied ? "Copied page URL" : "Copy page URL"}
                >
                  {isCopied ? <CheckIcon className="size-5" /> : <span>Copy</span>}
                </Button>
              </div>

              <Button
                nativeButton={false}
                size="lg"
                className="h-12 rounded-lg font-bold text-base! bg-indigo-400 hover:bg-indigo-500! border-indigo-400 shadow-lg group"
                render={
                  <Link href={`/${handle}/app`} className="flex items-center">
                    <span>Go to your page</span>
                    <ArrowRightIcon className="mt-0.5 size-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 stroke-3 transition-all" />
                  </Link>
                }
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
