"use client";

import { CompassIcon } from "lucide-react";
import { motion, useAnimate } from "motion/react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ProfilePageEditorProvider } from "@/components/profile/layout/profile-editor-provider";
import type { ProfileBentoGridPreviewMode } from "@/components/profile/v2/profile-bento-grid-actions";
import { ProfileBentoInteractiveGrid } from "@/components/profile/v2/profile-bento-interactive-grid";
import { ProfileBentoOwnerSettingPopover } from "@/components/profile/v2/profile-bento-owner-setting-popover";
import { ProfileBentoProfileEditor } from "@/components/profile/v2/profile-bento-profile-editor";
import { ProfileBentoSurfaceMotion } from "@/components/profile/v2/profile-bento-readonly-profile-motion";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useIsBelowLg, useIsBelowXxl } from "@/hooks/use-mobile";
import type { getProfileByHandle } from "@/lib/api/generated/http/profile-api/profile-api";
import type { GetMe200 } from "@/lib/api/generated/http/schemas/me-api";
import type { ProfileBentoItem, ProfilePageData } from "@/lib/profile/types";
import { cn } from "@/lib/utils";

type ProfileBentoOwnerEditorSurfaceProps = {
  bento: ProfileBentoItem[];
  disableAnalytics: boolean;
  editorData: ProfilePageData;
  initialProfileResponse: Awaited<ReturnType<typeof getProfileByHandle>> | null;
  initialUser: GetMe200 | null;
  ownerHandle: string;
};

const PREVIEW_SURFACE_TRANSITION = {
  borderRadius: { duration: 0.56, ease: [0.16, 1, 0.3, 1] },
  opacity: { duration: 0.36, ease: [0.16, 1, 0.3, 1] },
  width: { duration: 0.56, ease: [0.16, 1, 0.3, 1] },
} as const;

const ProfileBentoOwnerAnalyticsViews = dynamic(
  () =>
    import("@/components/profile/v2/profile-bento-owner-analytics-views").then(
      (module) => module.ProfileBentoOwnerAnalyticsViews
    ),
  {
    loading: () => (
      <button
        aria-disabled="true"
        className="inline-flex min-h-9 items-center gap-2 rounded-md px-3 py-2 text-neutral-500 transition-colors hover:bg-secondary/80 hover:text-neutral-500 focus-visible:outline-none focus-visible:ring-0 cursor-wait opacity-70"
        disabled
        type="button"
      >
        <span className="flex flex-col items-start leading-none text-xs">Loading...</span>
      </button>
    ),
    ssr: false,
  }
);

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
      <ProfileBentoOwnerAnalyticsViews
        disableAnalytics={disableAnalytics}
        ownerHandle={ownerHandle}
      />
    </footer>
  );
}

export function ProfileBentoOwnerEditorSurface({
  bento,
  disableAnalytics,
  editorData,
  initialProfileResponse,
  initialUser,
  ownerHandle,
}: ProfileBentoOwnerEditorSurfaceProps) {
  const isBelowLg = useIsBelowLg();
  const isBelowXxl = useIsBelowXxl();
  const [previewMode, setPreviewMode] = useState<ProfileBentoGridPreviewMode>("desktop");
  const [previewSurfaceScope, animatePreviewSurface] = useAnimate<HTMLDivElement>();
  const previewViewportRef = useRef<HTMLDivElement>(null);
  const didMountPreviewSurfaceRef = useRef(false);
  const isCompactSurface = isBelowXxl || previewMode === "mobile";
  const shouldFrameCompactSurface = !isBelowXxl && isCompactSurface;
  const previewSurfaceMode = shouldFrameCompactSurface ? "compact-frame" : "desktop-flow";
  const activePreviewMode: ProfileBentoGridPreviewMode = isCompactSurface ? "mobile" : "desktop";
  const sectionClassName = cn(
    "mx-auto flex min-h-lvh w-full flex-col items-center justify-center gap-8 px-6 pb-8 pt-[var(--v2-page-top-offset)] [--v2-page-top-offset:2rem] sm:px-8 xl:[--v2-page-top-offset:5rem] xl:px-10",
    isCompactSurface
      ? "justify-start px-0 sm:px-8"
      : "2xl:flex-row 2xl:items-stretch 2xl:justify-center 2xl:gap-[clamp(7.5rem,calc((100vw-96rem)*0.6+7.5rem),18rem)]"
  );
  const previewSurfaceClassName = cn(
    "relative mx-auto flex min-w-0 gap-8 xl:gap-8",
    isCompactSurface
      ? "w-full flex-col items-center"
      : "flex-col items-center 2xl:flex-row 2xl:items-stretch 2xl:justify-evenly 2xl:gap-[clamp(7.5rem,calc((100vw-96rem)*0.6+7.5rem),18rem)]",
    shouldFrameCompactSurface && "mb-12 h-[calc(100dvh-13rem)]"
  );
  const previewSurfaceWidth = shouldFrameCompactSurface ? "min(480px, calc(100vw - 3rem))" : "100%";
  const previewViewportClassName = shouldFrameCompactSurface
    ? "relative z-10 h-full w-full overflow-y-auto overflow-x-hidden overscroll-contain rounded-[inherit] scrollbar-hidden"
    : "contents";
  const compactInnerClassName = cn(
    "relative z-10 flex w-full flex-col items-center gap-8",
    shouldFrameCompactSurface && "py-12"
  );
  const previewFrameClassName = cn(
    "pointer-events-none absolute inset-0 z-0",
    shouldFrameCompactSurface && "bg-background"
  );
  const footerActionClassName = isBelowLg
    ? "w-full justify-center pb-12 pt-4"
    : "fixed bottom-12 left-12 z-30 w-auto justify-start p-0";

  useEffect(() => {
    void previewSurfaceMode;

    if (!didMountPreviewSurfaceRef.current) {
      didMountPreviewSurfaceRef.current = true;
      return;
    }

    void animatePreviewSurface(
      previewSurfaceScope.current,
      { opacity: [0, 1] },
      PREVIEW_SURFACE_TRANSITION.opacity
    );
  }, [animatePreviewSurface, previewSurfaceMode, previewSurfaceScope]);

  return (
    <ProfilePageEditorProvider
      initialData={editorData}
      initialProfileResponse={initialProfileResponse}
      handle={ownerHandle}
    >
      <section className={cn(sectionClassName, shouldFrameCompactSurface && "bg-secondary")}>
        <motion.div
          animate={{
            borderRadius: shouldFrameCompactSurface ? 64 : 0,
            width: previewSurfaceWidth,
          }}
          className={cn(
            previewSurfaceClassName,
            shouldFrameCompactSurface && "bg-background shadow-float"
          )}
          initial={false}
          transition={PREVIEW_SURFACE_TRANSITION}
        >
          <motion.div
            animate={{
              borderRadius: shouldFrameCompactSurface ? 64 : 0,
            }}
            className={previewFrameClassName}
            initial={false}
            ref={previewSurfaceScope}
            transition={PREVIEW_SURFACE_TRANSITION}
          />
          <div className={previewViewportClassName} ref={previewViewportRef}>
            <div className={isCompactSurface ? compactInnerClassName : "contents"}>
              <ProfileBentoSurfaceMotion delay={0} duration={0.68} initialScale={1} initialY={28}>
                <ProfileBentoProfileEditor
                  compactMode={isCompactSurface}
                  initialUser={initialUser}
                />
              </ProfileBentoSurfaceMotion>
              <ProfileBentoInteractiveGrid
                initialBento={bento}
                onPreviewModeChange={setPreviewMode}
                previewMode={activePreviewMode}
                scrollViewportRef={previewViewportRef}
              />
            </div>
          </div>
        </motion.div>
        <ProfileBentoOwnerFooterAction
          className={footerActionClassName}
          disableAnalytics={disableAnalytics}
          ownerHandle={ownerHandle}
        />
      </section>
    </ProfilePageEditorProvider>
  );
}
