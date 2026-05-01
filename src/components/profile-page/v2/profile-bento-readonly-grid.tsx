"use client";

import type { CSSProperties } from "react";
import { useMemo } from "react";
import { Responsive, useContainerWidth } from "react-grid-layout";
import { fastVerticalCompactor } from "react-grid-layout/extras";
import {
  BREAKPOINTS,
  COLS,
  GRID_MARGIN,
  GRID_PADDING,
  getGridRowHeight,
} from "@/lib/grid/grid-config";
import type { GridBreakpoint } from "@/lib/grid/grid-types";
import type { ProfileBentoItem } from "@/lib/profile-page/types";
import { ProfileBentoGridCard } from "./profile-bento-grid-card";
import { toBentoGridLayouts } from "./profile-bento-grid-model";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

type ProfileBentoReadonlyGridProps = {
  bento: ProfileBentoItem[];
};

export function ProfileBentoReadonlyGrid({ bento }: ProfileBentoReadonlyGridProps) {
  const { width, containerRef, mounted } = useContainerWidth({
    initialWidth: 864,
    measureBeforeMount: true,
  });
  const activeBreakpoint: GridBreakpoint = width > BREAKPOINTS.desktop ? "desktop" : "compact";
  const layouts = useMemo(() => toBentoGridLayouts(bento), [bento]);
  const rowHeight = getGridRowHeight(width, activeBreakpoint);
  const gridStyle = {
    "--thin-item-visible-height": `${Math.round(rowHeight * 0.75)}px`,
  } as CSSProperties;

  if (!mounted) {
    return (
      <section className="min-w-0 flex-1 xl:w-[56rem] xl:flex-none">
        <div className="h-96 w-[380px] max-w-full rounded-2xl border border-black/10 xl:w-full" />
      </section>
    );
  }

  return (
    <section className="min-w-0 flex-1 xl:w-[56rem] xl:flex-none">
      <div
        className="w-[380px] max-w-full xl:w-full [&_.react-grid-item]:duration-[600ms]! [&_.react-grid-item]:ease-out! [&_.react-resizable-handle]:hidden! [&_.react-resizable-handle]:pointer-events-none!"
        ref={containerRef}
        style={gridStyle}
      >
        <Responsive<GridBreakpoint>
          autoSize
          breakpoints={BREAKPOINTS}
          className="rounded-2xl"
          cols={COLS}
          compactor={fastVerticalCompactor}
          containerPadding={GRID_PADDING}
          dragConfig={{ bounded: false, enabled: false }}
          layouts={layouts}
          margin={GRID_MARGIN}
          maxRows={48}
          resizeConfig={{ enabled: false }}
          rowHeight={rowHeight}
          width={width}
        >
          {bento.map((item) => (
            <div
              className={`overflow-visible rounded-xl ${item.type === "section" ? "flex items-end" : ""}`}
              key={item.id}
            >
              <div
                className={`relative flex w-full flex-col justify-between rounded-xl bg-white p-2 shadow-float ${item.type === "section" ? "h-[var(--thin-item-visible-height)]" : "h-full"}`}
              >
                <div className="min-h-0 flex-1">
                  <ProfileBentoGridCard item={item} />
                </div>
              </div>
            </div>
          ))}
        </Responsive>
      </div>
    </section>
  );
}
