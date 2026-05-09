"use client";

import { CompassIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ProfilePageEditorProvider } from "@/components/profile/layout/profile-editor-provider";
import { ProfileBentoInteractiveGrid } from "@/components/profile/v2/profile-bento-interactive-grid";
import { ProfileBentoOwnerSettingPopover } from "@/components/profile/v2/profile-bento-owner-setting-popover";
import { ProfileBentoProfileEditor } from "@/components/profile/v2/profile-bento-profile-editor";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { getAppApiBaseURL } from "@/lib/api/base-url";
import type { ProfileBentoItem, ProfilePageData } from "@/lib/profile/types";
import { cn } from "@/lib/utils";

type ProfileBentoOwnerEditorSurfaceProps = {
  bento: ProfileBentoItem[];
  analyticsViews: number;
  disableAnalytics: boolean;
  editorData: ProfilePageData;
  ownerHandle: string;
};

const PROFILE_BENTO_PAGE_SECTION_CLASS =
  "mx-auto flex min-h-lvh w-full flex-col items-center gap-8 px-6 pb-8 pt-[var(--v2-page-top-offset)] [--v2-page-top-offset:2rem] sm:px-8 xl:[--v2-page-top-offset:5rem] xl:flex-row xl:items-stretch xl:justify-center xl:gap-[clamp(3rem,calc((100vw-80rem)*0.25+3rem),6rem)] xl:px-10 2xl:gap-[clamp(7.5rem,calc((100vw-96rem)*0.6+7.5rem),18rem)]";
const numberFormatter = new Intl.NumberFormat("en-US");

function ProfileBentoOwnerFooterAction({
  className,
  analyticsViews,
  disableAnalytics,
  ownerHandle,
}: {
  className?: string;
  analyticsViews: number;
  disableAnalytics: boolean;
  ownerHandle: string;
}) {
  const [displayAnalyticsViews, setDisplayAnalyticsViews] = useState(analyticsViews);
  const actionClassName =
    "inline-flex min-h-9 items-center gap-2 rounded-md px-3 py-2 text-neutral-500 transition-colors hover:bg-secondary/80 hover:text-neutral-500 focus-visible:outline-none focus-visible:ring-0";
  const iconButtonClassName =
    "border-0 bg-transparent text-neutral-500 shadow-none outline-none ring-0 hover:bg-secondary/80 focus-visible:outline-none focus-visible:ring-0";
  const analyticsViewsLabel =
    displayAnalyticsViews === 0
      ? "No Views Today"
      : `${numberFormatter.format(displayAnalyticsViews)} views`;

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

        const data = (await response.json()) as {
          state?: string;
          summaries?: {
            today?: {
              pageViews?: number;
            };
          };
        };

        if (data.state === "ready") {
          setDisplayAnalyticsViews(data.summaries?.today?.pageViews ?? 0);
        }
      } catch {
        // Keep the server-rendered fallback when the client refresh fails.
      }
    })();

    return () => {
      controller.abort();
    };
  }, [disableAnalytics]);

  return (
    <footer className={cn("flex items-center justify-center gap-0", className)}>
      <ProfileBentoOwnerSettingPopover />
      <Tooltip>
        <TooltipTrigger
          render={
            <Link
              aria-label="Explore"
              href="/explore"
              prefetch={false}
              className={cn(
                "inline-flex size-9 items-center justify-center rounded-md",
                iconButtonClassName
              )}
            >
              <CompassIcon aria-hidden className="size-4" />
            </Link>
          }
        />
        <TooltipContent side="top" sideOffset={8}>
          Explore
        </TooltipContent>
      </Tooltip>
      <Separator
        orientation="vertical"
        className={"data-vertical:w-[2.5px] data-vertical:my-2.5 rounded-lg mx-3"}
      />
      <Tooltip>
        <TooltipTrigger
          render={
            disableAnalytics ? (
              <button
                aria-disabled="true"
                className={cn(
                  actionClassName,
                  "cursor-not-allowed disabled:!opacity-100 disabled:!text-neutral-500"
                )}
                disabled
                type="button"
              >
                {/*<ChartColumnBigIcon aria-hidden className="size-4 shrink-0" />*/}
                <span className="flex flex-col items-start leading-none text-xs">
                  {analyticsViewsLabel}
                </span>
              </button>
            ) : (
              <Link
                aria-label="Analytics"
                href={`/${ownerHandle}/analytics`}
                className={actionClassName}
              >
                {/*<ChartColumnBigIcon aria-hidden className="size-4 shrink-0" />*/}
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
    </footer>
  );
}

export function ProfileBentoOwnerEditorSurface({
  bento,
  analyticsViews,
  disableAnalytics,
  editorData,
  ownerHandle,
}: ProfileBentoOwnerEditorSurfaceProps) {
  return (
    <ProfilePageEditorProvider initialData={editorData} handle={ownerHandle}>
      <section className={PROFILE_BENTO_PAGE_SECTION_CLASS}>
        <ProfileBentoProfileEditor />
        <ProfileBentoInteractiveGrid initialBento={bento} />
        <ProfileBentoOwnerFooterAction
          className="w-full py-16 xl:fixed xl:bottom-12 xl:left-12 xl:z-30 xl:w-auto xl:justify-start xl:p-0"
          analyticsViews={analyticsViews}
          disableAnalytics={disableAnalytics}
          ownerHandle={ownerHandle}
        />
      </section>
    </ProfilePageEditorProvider>
  );
}
