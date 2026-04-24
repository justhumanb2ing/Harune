"use client";

import { Button } from "@/components/ui/button";
import { appConfig } from "@/lib/config";
import { CheckIcon, CopyIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import * as React from "react";

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
    <div className="mx-auto flex h-full max-w-5xl flex-col gap-4 py-6 items-center justify-center">
      <div className="w-full flex-1 px-4 pb-8">
        <div className="flex flex-col min-h-full gap-32 pt-20 lg:flex-row">
          <div className="flex-4 w-full min-h-full h-full rounded-xl overflow-hidden">
            <Image
              src={"/images/onboarding_sample.jpeg"}
              alt="onboarding_success"
              width={400}
              height={400}
              className="w-full h-[44rem] lg:h-full rounded-xl object-cover"
            />
          </div>

          <div className="flex flex-col justify-center gap-6 max-w-full flex-3">
            <h1 className="text-3xl font-medium tracking-tight">Your page is ready!</h1>

            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between rounded-lg bg-background px-5 py-3 pr-2">
                <span className="text-lg font-medium">{`${appConfig.url}/${handle}`.slice(8)}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-lg"
                  onClick={() => void handleCopyPageUrl()}
                  aria-label={isCopied ? "Copied page URL" : "Copy page URL"}
                >
                  {isCopied ? <CheckIcon className="size-5" /> : <CopyIcon className="size-5" />}
                </Button>
              </div>

              <Button
                nativeButton={false}
                size="lg"
                className="h-12 rounded-lg font-medium px-5 text-sm uppercase"
                render={<Link href={`/${handle}/section`}>Go to page</Link>}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
