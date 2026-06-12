"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { getAppApiBaseURL } from "@/lib/api/base-url";
import { cn } from "@/lib/utils";

const numberFormatter = new Intl.NumberFormat("en-US");

type ProfileBentoOwnerAnalyticsViewsProps = {
  className?: string;
  disableAnalytics: boolean;
  ownerHandle: string;
};

export function ProfileBentoOwnerAnalyticsViews({
  className,
  disableAnalytics,
  ownerHandle,
}: ProfileBentoOwnerAnalyticsViewsProps) {
  const [displayAnalyticsViews, setDisplayAnalyticsViews] = useState<number | null>(null);
  const actionClassName =
    "inline-flex min-h-9 items-center gap-2 rounded-md px-3 py-2 text-neutral-500 transition-colors hover:bg-secondary/80 hover:text-neutral-500 focus-visible:outline-none focus-visible:ring-0";

  useEffect(() => {
    if (disableAnalytics) {
      return;
    }

    const controller = new AbortController();

    void (async () => {
      try {
        const response = await fetch(`${getAppApiBaseURL()}/me/analytics`, {
          cache: "no-store",
          credentials: "include",
          signal: controller.signal,
        });

        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as { visitors?: number };
        setDisplayAnalyticsViews(data.visitors ?? 0);
      } catch {
        // Keep the loading/disabled fallback if the client refresh fails.
      }
    })();

    return () => {
      controller.abort();
    };
  }, [disableAnalytics]);

  const resolvedAnalyticsViews = disableAnalytics ? 0 : displayAnalyticsViews;
  const analyticsViewsLabel =
    resolvedAnalyticsViews === null
      ? "Loading..."
      : resolvedAnalyticsViews === 0
        ? "No Views Today"
        : `${numberFormatter.format(resolvedAnalyticsViews)} views`;

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          disableAnalytics ? (
            <button
              aria-disabled="true"
              className={cn(
                actionClassName,
                className,
                "cursor-not-allowed disabled:!opacity-100 disabled:!text-neutral-500"
              )}
              disabled
              type="button"
            >
              <span className="flex flex-col items-start leading-none text-xs">
                {analyticsViewsLabel}
              </span>
            </button>
          ) : (
            <Link
              aria-label="Analytics"
              href={`/${ownerHandle}/analytics`}
              className={cn(actionClassName, className)}
            >
              <span className="flex flex-col items-start leading-none text-xs">
                {analyticsViewsLabel}
              </span>
            </Link>
          )
        }
      />
      <TooltipContent side="top" sideOffset={8}>
        Upgrade plan for details (comming soon)
      </TooltipContent>
    </Tooltip>
  );
}
