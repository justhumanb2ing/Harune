"use client";

import { ChartColumnBigIcon, TrophyIcon } from "lucide-react";
import Link from "next/link";
import { ProfilePageEditorProvider } from "@/components/profile/layout/profile-editor-provider";
import { ProfileBentoInteractiveGrid } from "@/components/profile/v2/profile-bento-interactive-grid";
import { ProfileBentoOwnerSettingPopover } from "@/components/profile/v2/profile-bento-owner-setting-popover";
import { ProfileBentoProfileEditor } from "@/components/profile/v2/profile-bento-profile-editor";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { ProfileBentoItem, ProfilePageData } from "@/lib/profile/types";
import { cn } from "@/lib/utils";

type ProfileBentoOwnerEditorSurfaceProps = {
  bento: ProfileBentoItem[];
  disableAnalytics: boolean;
  editorData: ProfilePageData;
  ownerHandle: string;
};

const PROFILE_BENTO_PAGE_SECTION_CLASS =
  "mx-auto flex min-h-lvh w-full flex-col items-center gap-8 px-6 pb-8 pt-[var(--v2-page-top-offset)] [--v2-page-top-offset:2rem] sm:px-8 xl:[--v2-page-top-offset:5rem] xl:flex-row xl:items-stretch xl:justify-center xl:gap-[clamp(3rem,calc((100vw-80rem)*0.25+3rem),6rem)] xl:px-10 2xl:gap-[clamp(7.5rem,calc((100vw-96rem)*0.6+7.5rem),18rem)]";

function ProfileBentoOwnerFooterAction({
  className,
  disableAnalytics,
  ownerHandle,
}: {
  className?: string;
  disableAnalytics: boolean;
  ownerHandle: string;
}) {
  const iconButtonClassName =
    "border-0 bg-transparent text-neutral-500 shadow-none outline-none ring-0 hover:bg-secondary/80 focus-visible:outline-none focus-visible:ring-0";

  return (
    <footer className={cn("flex items-center justify-center gap-0", className)}>
      <ProfileBentoOwnerSettingPopover />
      <Tooltip>
        <TooltipTrigger
          render={
            disableAnalytics ? (
              <span
                aria-disabled="true"
                className={cn(
                  "inline-flex size-9 cursor-not-allowed items-center justify-center rounded-md opacity-50",
                  iconButtonClassName
                )}
              >
                <ChartColumnBigIcon aria-hidden className="size-4" />
              </span>
            ) : (
              <Link
                aria-label="Analytics"
                href={`/${ownerHandle}/analytics`}
                className={cn(
                  "inline-flex size-9 items-center justify-center rounded-md",
                  iconButtonClassName
                )}
              >
                <ChartColumnBigIcon aria-hidden className="size-4" />
              </Link>
            )
          }
        />
        <TooltipContent side="top" sideOffset={8}>
          Analytics
        </TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger
          render={
            <Link
              aria-label="Leaderboard"
              href="/leaderboard"
              className={cn(
                "inline-flex size-9 items-center justify-center rounded-md",
                iconButtonClassName
              )}
            >
              <TrophyIcon aria-hidden className="size-4" />
            </Link>
          }
        />
        <TooltipContent side="top" sideOffset={8}>
          Leaderboard
        </TooltipContent>
      </Tooltip>
    </footer>
  );
}

export function ProfileBentoOwnerEditorSurface({
  bento,
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
          className="w-full py-16 md:fixed md:bottom-12 md:left-12 md:z-30 md:w-auto md:justify-start md:p-0"
          disableAnalytics={disableAnalytics}
          ownerHandle={ownerHandle}
        />
      </section>
    </ProfilePageEditorProvider>
  );
}
