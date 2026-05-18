"use client";

import { useMotionValue } from "motion/react";
import type { CSSProperties } from "react";
import { useEffect, useMemo, useState } from "react";
import { useContainerWidth } from "react-grid-layout";
import { ResponsiveGridCanvas } from "@/components/grid/responsive-grid-canvas";
import { BREAKPOINTS, getGridRowHeight } from "@/lib/grid/grid-config";
import { getGridLayoutPixelHeight } from "@/lib/grid/grid-layout-utils";
import type { GridBreakpoint } from "@/lib/grid/grid-types";
import type { ProfileBentoItem } from "@/lib/profile/types";
import { getProfileBentoLinkSize, ProfileBentoGridCard } from "./profile-bento-grid-card";
import { toBentoGridItem, toBentoGridLayouts } from "./profile-bento-grid-model";
import { ProfileBentoSurfaceMotion } from "./profile-bento-readonly-profile-motion";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

const PUBLIC_PAGE_DESKTOP_VIEWPORT_WIDTH = 1536;
const PUBLIC_PAGE_COMPACT_CANVAS_WIDTH = 400;
const PUBLIC_PAGE_COMPACT_CANVAS_WIDTH_FALLBACK = 360;

type ProfileBentoReadonlyGridSurface = "contained" | "public-page";

type ProfileBentoReadonlyGridProps = {
  bento: ProfileBentoItem[];
  preventNavigation?: boolean;
  surface?: ProfileBentoReadonlyGridSurface;
};

function useViewportWidth() {
  const [width, setWidth] = useState(864);

  useEffect(() => {
    const updateWidth = () => {
      setWidth(window.innerWidth);
    };

    updateWidth();
    window.addEventListener("resize", updateWidth);

    return () => {
      window.removeEventListener("resize", updateWidth);
    };
  }, []);

  return width;
}

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

export function ProfileBentoReadonlyGrid({
  bento,
  preventNavigation = false,
  surface = "contained",
}: ProfileBentoReadonlyGridProps) {
  const viewportWidth = useViewportWidth();
  const { width, containerRef, mounted } = useContainerWidth({
    initialWidth: 864,
    measureBeforeMount: true,
  });
  const activeBreakpoint = getProfileBentoReadonlyGridBreakpoint({
    measuredWidth: width,
    surface,
    viewportWidth,
  });
  const canvasWidth = getProfileBentoReadonlyGridCanvasWidth({
    activeBreakpoint,
    measuredWidth: width,
    surface,
  });
  const layouts = useMemo(() => toBentoGridLayouts(bento), [bento]);
  const gridItems = useMemo(() => bento.map(toBentoGridItem), [bento]);
  const bentoById = useMemo(() => new Map(bento.map((item) => [item.id, item] as const)), [bento]);
  const rowHeight = getGridRowHeight(canvasWidth, activeBreakpoint);
  const gridMinHeight = getGridLayoutPixelHeight(layouts, activeBreakpoint, rowHeight, 40);
  const isCompactCanvas = activeBreakpoint === "compact";
  const gridWrapperStyle = surface === "public-page" ? undefined : { minHeight: gridMinHeight };
  const cardRotate = useMotionValue(0);
  const cardX = useMotionValue(0);
  const gridStyle = {
    "--thin-item-visible-height": `${Math.round(rowHeight * 0.9)}px`,
  } as CSSProperties;

  return (
    <ProfileBentoSurfaceMotion
      className={isCompactCanvas ? "w-full" : undefined}
      delay={0.5}
      duration={0.78}
      initialScale={0.96}
      initialY={18}
      reduceMotionDuration={0.42}
      reduceMotionY={8}
    >
      <div
        className={
          isCompactCanvas
            ? "mx-auto w-[360px] max-w-full flex-none sm:w-[400px]"
            : "min-w-0 flex-1 xl:w-[860px] xl:flex-none 2xl:w-[860px]"
        }
        style={gridWrapperStyle}
      >
        <div
          className="w-[360px] max-w-full sm:w-[400px] xl:w-full [&_.react-grid-item]:duration-[600ms]! [&_.react-grid-item]:ease-out! [&_.react-resizable-handle]:hidden! [&_.react-resizable-handle]:pointer-events-none!"
          ref={containerRef}
          style={gridStyle}
        >
          {mounted ? (
            <ResponsiveGridCanvas
              activeBreakpoint={activeBreakpoint}
              activeDragItemId={null}
              activeDragIntentItemId={null}
              cardRotate={cardRotate}
              cardX={cardX}
              items={gridItems}
              layouts={layouts}
              mounted={mounted}
              onDrag={() => {}}
              onDragStart={() => {}}
              onDragStop={() => {}}
              onDragIntentStart={() => {}}
              onDragIntentStop={() => {}}
              onLayoutChange={() => {}}
              onRemoveItem={() => {}}
              onResizeItem={() => {}}
              onResizeStart={() => {}}
              onResizeStop={() => {}}
              readOnly
              rowHeight={rowHeight}
              width={canvasWidth}
              renderItem={(gridItem) => {
                const item = bentoById.get(gridItem.id);

                return item ? (
                  <ProfileBentoGridCard
                    activeBreakpoint={activeBreakpoint}
                    item={item}
                    layoutSize={getProfileBentoLinkSize(
                      item.layout[activeBreakpoint].w,
                      item.layout[activeBreakpoint].h
                    )}
                    preventNavigation={preventNavigation}
                  />
                ) : null;
              }}
            />
          ) : null}
        </div>
      </div>
    </ProfileBentoSurfaceMotion>
  );
}
