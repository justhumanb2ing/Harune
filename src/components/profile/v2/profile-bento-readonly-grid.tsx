"use client";

import { useMotionValue } from "motion/react";
import type { CSSProperties } from "react";
import { useMemo } from "react";
import { useContainerWidth } from "react-grid-layout";
import { ResponsiveGridCanvas } from "@/components/grid/responsive-grid-canvas";
import { BREAKPOINTS, getGridRowHeight } from "@/lib/grid/grid-config";
import type { GridBreakpoint } from "@/lib/grid/grid-types";
import type { ProfileBentoItem } from "@/lib/profile/types";
import { ProfileBentoGridMotion } from "./profile-bento-entry-motion";
import { getProfileBentoLinkSize, ProfileBentoGridCard } from "./profile-bento-grid-card";
import { toBentoGridItem, toBentoGridLayouts } from "./profile-bento-grid-model";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

type ProfileBentoReadonlyGridProps = {
  bento: ProfileBentoItem[];
  preventNavigation?: boolean;
};

export function ProfileBentoReadonlyGrid({
  bento,
  preventNavigation = false,
}: ProfileBentoReadonlyGridProps) {
  const { width, containerRef, mounted } = useContainerWidth({
    initialWidth: 864,
    measureBeforeMount: true,
  });
  const activeBreakpoint: GridBreakpoint = width > BREAKPOINTS.desktop ? "desktop" : "compact";
  const layouts = useMemo(() => toBentoGridLayouts(bento), [bento]);
  const gridItems = useMemo(() => bento.map(toBentoGridItem), [bento]);
  const bentoById = useMemo(() => new Map(bento.map((item) => [item.id, item] as const)), [bento]);
  const rowHeight = getGridRowHeight(width, activeBreakpoint);
  const cardRotate = useMotionValue(0);
  const cardX = useMotionValue(0);
  const gridStyle = {
    "--thin-item-visible-height": `${Math.round(rowHeight * 0.75)}px`,
  } as CSSProperties;

  return (
    <ProfileBentoGridMotion className="min-w-0 flex-1 xl:w-[52rem] xl:flex-none 2xl:w-[56rem]">
      <div
        className="w-[380px] max-w-full sm:w-[425px] xl:w-full [&_.react-grid-item]:duration-[600ms]! [&_.react-grid-item]:ease-out! [&_.react-resizable-handle]:hidden! [&_.react-resizable-handle]:pointer-events-none!"
        ref={containerRef}
        style={gridStyle}
      >
        <ResponsiveGridCanvas
          activeBreakpoint={activeBreakpoint}
          activeDragItemId={null}
          cardRotate={cardRotate}
          cardX={cardX}
          items={gridItems}
          layouts={layouts}
          mounted={mounted}
          onDrag={() => {}}
          onDragStart={() => {}}
          onDragStop={() => {}}
          onLayoutChange={() => {}}
          onRemoveItem={() => {}}
          onResizeItem={() => {}}
          onResizeStart={() => {}}
          onResizeStop={() => {}}
          readOnly
          rowHeight={rowHeight}
          width={width}
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
      </div>
    </ProfileBentoGridMotion>
  );
}
