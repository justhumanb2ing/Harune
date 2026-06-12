"use client";

import type { CSSProperties, ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  getBackgroundColorOption,
  getGridTextSurfaceClassNames,
  normalizeGridTextSurfaceStyle,
} from "@/components/profile/grid/grid-text-surface";
import { GridTextSurfaceProvider } from "@/components/profile/grid/grid-text-surface-context";
import {
  getProfileBentoLinkSize,
  ProfileBentoGridCard,
} from "@/components/profile/grid/profile-bento-grid-card";
import { ProfileBentoGridItemRevealMotion } from "@/components/profile/grid/profile-bento-grid-item-reveal-motion";
import { toBentoGridItem } from "@/components/profile/grid/profile-bento-grid-model";
import { BREAKPOINTS, THIN_PLACEHOLDER_ITEM_ID } from "@/lib/grid/grid-config";
import type { GridBreakpoint, GridItem } from "@/lib/grid/grid-types";
import type { ProfileBentoItem } from "@/lib/profile/types";
import { cn } from "@/lib/utils";

type ProfileBentoReadonlyGridSurface = "contained" | "public-page";

type ProfileBentoReadonlyGridProps = {
  bento: ProfileBentoItem[];
  preventNavigation?: boolean;
  surface?: ProfileBentoReadonlyGridSurface;
};

type ReadonlyGridItemStyle = CSSProperties & {
  [key: `--${string}`]: string | number | undefined;
  "--compact-grid-column": string;
  "--compact-grid-row": string;
  "--desktop-grid-column": string;
  "--desktop-grid-row": string;
};

type ReadonlyCardStyle = CSSProperties & {
  [key: `--${string}`]: string | number | undefined;
  "--grid-card-muted-foreground"?: string;
  "--grid-card-control-background"?: string;
  "--tw-inset-ring-color"?: string;
};

const PUBLIC_PAGE_COMPACT_CANVAS_WIDTH = 400;
const PUBLIC_PAGE_COMPACT_CANVAS_WIDTH_FALLBACK = 360;
const PUBLIC_PAGE_DESKTOP_VIEWPORT_WIDTH = 1536;

export function getProfileBentoReadonlyGridBreakpoint({
  measuredWidth,
  surface = "contained",
  viewportWidth,
}: {
  measuredWidth: number;
  surface?: ProfileBentoReadonlyGridSurface;
  viewportWidth: number;
}): GridBreakpoint {
  if (surface === "public-page") {
    return viewportWidth >= PUBLIC_PAGE_DESKTOP_VIEWPORT_WIDTH ? "desktop" : "compact";
  }

  return measuredWidth > BREAKPOINTS.desktop ? "desktop" : "compact";
}

export function getProfileBentoReadonlyGridCanvasWidth({
  activeBreakpoint,
  measuredWidth,
  surface = "contained",
}: {
  activeBreakpoint: GridBreakpoint;
  measuredWidth: number;
  surface?: ProfileBentoReadonlyGridSurface;
}) {
  if (activeBreakpoint === "desktop") {
    return Math.max(measuredWidth, 860);
  }

  if (surface === "public-page") {
    return Math.min(
      measuredWidth || PUBLIC_PAGE_COMPACT_CANVAS_WIDTH_FALLBACK,
      PUBLIC_PAGE_COMPACT_CANVAS_WIDTH
    );
  }

  return measuredWidth;
}

function getGridPositionStyle(item: ProfileBentoItem, breakpoint: GridBreakpoint) {
  const layout = item.layout[breakpoint];

  return {
    column: `${layout.x + 1} / span ${layout.w}`,
    row: `${layout.y + 1} / span ${layout.h}`,
  };
}

function usePublicReadonlyBreakpoint(): GridBreakpoint {
  const [breakpoint, setBreakpoint] = useState<GridBreakpoint>("compact");

  useEffect(() => {
    const query = window.matchMedia("(min-width: 1536px)");
    const updateBreakpoint = () => {
      setBreakpoint(query.matches ? "desktop" : "compact");
    };

    updateBreakpoint();
    query.addEventListener("change", updateBreakpoint);

    return () => {
      query.removeEventListener("change", updateBreakpoint);
    };
  }, []);

  return breakpoint;
}

function ReadonlyGridCardShell({
  activeBreakpoint,
  children,
  gridItem,
}: {
  activeBreakpoint: GridBreakpoint;
  children: ReactNode;
  gridItem: GridItem;
}) {
  const isThinPlaceholderItem = gridItem.id === THIN_PLACEHOLDER_ITEM_ID;
  const isSectionItem = gridItem.itemType === "section";
  const isVisuallyThinItem = isThinPlaceholderItem || isSectionItem;
  const shadowClassName = isSectionItem ? "shadow-none" : "shadow-xs";
  const textSurfaceStyle =
    gridItem.itemType === "text" ? normalizeGridTextSurfaceStyle(gridItem.textSurfaceStyle) : null;
  const textSurfaceBackgroundColorOption = textSurfaceStyle
    ? getBackgroundColorOption(textSurfaceStyle.backgroundColor)
    : null;
  const textSurfaceClassNames = textSurfaceStyle
    ? getGridTextSurfaceClassNames(textSurfaceStyle)
    : null;
  const isFullBleedItem =
    gridItem.isFullBleed ||
    gridItem.itemType === "media" ||
    gridItem.itemType === "map" ||
    gridItem.itemType === "clock";
  const shouldRemovePadding = isFullBleedItem || gridItem.itemType === "text";
  const paddingClassName = shouldRemovePadding ? "p-0" : isVisuallyThinItem ? "p-2" : "p-4";
  const radiusClassName = isVisuallyThinItem ? "rounded-2xl" : "rounded-[1.5rem]";
  const bevelClassName =
    (isFullBleedItem && gridItem.itemType !== "clock") ||
    (gridItem.itemType === "text" && textSurfaceBackgroundColorOption?.id !== "white")
      ? "surface-bevel"
      : "";
  const frameClassName = isSectionItem
    ? "outline-none inset-ring-0"
    : gridItem.itemType === "text"
      ? textSurfaceBackgroundColorOption?.id === "white"
        ? "outline-border/35 inset-ring-1"
        : "outline-none"
      : gridItem.itemType === "map"
        ? "outline-border/35 inset-ring-1"
        : isFullBleedItem
          ? "outline-none"
          : "outline-border/35 inset-ring-1";
  const shellStyle = gridItem.theme
    ? {
        "--grid-card-control-background": gridItem.theme.controlBackgroundColor,
        "--grid-card-muted-foreground": gridItem.theme.mutedForegroundColor,
        "--tw-inset-ring-color":
          gridItem.itemType === "link"
            ? `color-mix(in srgb, ${gridItem.theme.backgroundColor} 90%, black)`
            : "color-mix(in srgb, var(--border) 80%, transparent)",
        backgroundColor: gridItem.theme.backgroundColor,
        color: gridItem.theme.foregroundColor,
      }
    : textSurfaceStyle
      ? {
          "--tw-inset-ring-color": "color-mix(in srgb, var(--border) 80%, transparent)",
          backgroundColor: textSurfaceStyle.backgroundColor,
        }
      : gridItem.itemType === "clock" && gridItem.clockBackgroundColor
        ? {
            "--tw-inset-ring-color": "color-mix(in srgb, var(--border) 80%, transparent)",
            backgroundColor: gridItem.clockBackgroundColor,
          }
        : {
            "--tw-inset-ring-color": "color-mix(in srgb, var(--border) 80%, transparent)",
          };
  const shellBackgroundClassName =
    gridItem.itemType === "text" && textSurfaceClassNames
      ? textSurfaceClassNames.backgroundColorClassName
      : "bg-white";

  void activeBreakpoint;

  return (
    <div
      className={cn(
        "group/item relative h-full w-full cursor-default pointer-events-auto",
        isVisuallyThinItem && "h-[var(--thin-item-visible-height)]"
      )}
      data-link-provider-theme={gridItem.theme ? "true" : undefined}
    >
      <div
        className={cn(
          "relative flex h-full min-h-0 w-full flex-col justify-between",
          frameClassName,
          radiusClassName,
          shellBackgroundClassName,
          paddingClassName,
          bevelClassName,
          shadowClassName
        )}
        style={shellStyle satisfies ReadonlyCardStyle}
      >
        <div aria-hidden className="pointer-events-none absolute inset-0 rounded-[inherit]" />
        <div className="min-h-0 flex-1">
          {gridItem.itemType === "text" && textSurfaceClassNames ? (
            <div
              className={cn(
                "relative flex h-full min-h-0 w-full flex-col overflow-hidden rounded-[1.5rem]",
                textSurfaceBackgroundColorOption?.id === "white" ? "" : "surface-bevel"
              )}
            >
              <div className="min-h-0 flex-1 p-4">
                <GridTextSurfaceProvider
                  backgroundColorClassName={textSurfaceClassNames.backgroundColorClassName}
                  focusVisibleBackgroundClassName={
                    textSurfaceClassNames.focusVisibleBackgroundClassName
                  }
                  foregroundClassName={textSurfaceClassNames.foregroundClassName}
                  hoverBackgroundClassName={textSurfaceClassNames.hoverBackgroundClassName}
                  textAlignClassName={textSurfaceClassNames.textAlignClassName}
                  verticalAlignClassName={textSurfaceClassNames.verticalAlignClassName}
                >
                  {children}
                </GridTextSurfaceProvider>
              </div>
            </div>
          ) : (
            children
          )}
        </div>
      </div>
    </div>
  );
}

export function ProfileBentoReadonlyGrid({
  bento,
  preventNavigation = false,
  surface = "contained",
}: ProfileBentoReadonlyGridProps) {
  const activeBreakpoint = usePublicReadonlyBreakpoint();
  const gridItems = useMemo(() => bento.map(toBentoGridItem), [bento]);
  const gridItemById = useMemo(
    () => new Map(gridItems.map((item) => [item.id, item] as const)),
    [gridItems]
  );
  const gridItemRevealIndexById = useMemo(
    () => new Map(gridItems.map((item, index) => [item.id, index] as const)),
    [gridItems]
  );
  const wrapperClassName =
    surface === "public-page"
      ? "mx-auto w-[360px] max-w-full flex-none sm:w-[400px] 2xl:w-[860px] 2xl:flex-none"
      : "mx-auto w-[360px] max-w-full flex-none sm:w-[400px] xl:w-[860px]";

  return (
    <div
      className={cn(
        "w-full 2xl:w-[860px] 2xl:flex-none",
        surface !== "public-page" && "min-w-0 flex-1 xl:w-[860px] xl:flex-none"
      )}
    >
      <div
        className={cn(
          "grid max-w-full auto-rows-[var(--readonly-grid-row-height)] grid-cols-2 gap-5 [--readonly-grid-row-height:calc(((var(--readonly-grid-width)-20px)/2-20px)/2)] [--thin-item-visible-height:calc(var(--readonly-grid-row-height)*0.9)] sm:[--readonly-grid-width:400px] 2xl:grid-cols-4 2xl:gap-10 2xl:[--readonly-grid-row-height:calc(((860px-120px)/4-40px)/2)] 2xl:[--readonly-grid-width:860px]",
          wrapperClassName
        )}
        style={
          {
            "--readonly-grid-width": `${Math.min(PUBLIC_PAGE_COMPACT_CANVAS_WIDTH, 360)}px`,
          } as CSSProperties
        }
      >
        {bento.map((item) => {
          const gridItem = gridItemById.get(item.id);

          if (!gridItem) {
            return null;
          }

          const compactPosition = getGridPositionStyle(item, "compact");
          const desktopPosition = getGridPositionStyle(item, "desktop");
          const layoutSize = getProfileBentoLinkSize(
            item.layout[activeBreakpoint].w,
            item.layout[activeBreakpoint].h
          );
          const itemStyle: ReadonlyGridItemStyle = {
            "--compact-grid-column": compactPosition.column,
            "--compact-grid-row": compactPosition.row,
            "--desktop-grid-column": desktopPosition.column,
            "--desktop-grid-row": desktopPosition.row,
          };

          return (
            <div
              className={cn(
                "relative min-w-0 overflow-visible rounded-[1.5rem] [grid-column:var(--compact-grid-column)] [grid-row:var(--compact-grid-row)] 2xl:[grid-column:var(--desktop-grid-column)] 2xl:[grid-row:var(--desktop-grid-row)]",
                item.type === "section" && "mt-4 2xl:mt-8"
              )}
              data-profile-bento-grid-item-id={item.id}
              key={item.id}
              style={itemStyle}
            >
              <ProfileBentoGridItemRevealMotion index={gridItemRevealIndexById.get(item.id) ?? 0}>
                <ReadonlyGridCardShell activeBreakpoint={activeBreakpoint} gridItem={gridItem}>
                  <ProfileBentoGridCard
                    activeBreakpoint={activeBreakpoint}
                    item={item}
                    layoutSize={item.type === "link" ? layoutSize : undefined}
                    preventNavigation={preventNavigation}
                  />
                </ReadonlyGridCardShell>
              </ProfileBentoGridItemRevealMotion>
            </div>
          );
        })}
      </div>
    </div>
  );
}
