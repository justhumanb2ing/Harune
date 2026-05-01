"use client";

import type { CSSProperties } from "react";
import { useMemo, useState } from "react";
import { useContainerWidth } from "react-grid-layout";
import { ResponsiveGridCanvas } from "@/components/grid/responsive-grid-canvas";
import { ProfileBentoGridActions } from "@/components/profile-page/v2/profile-bento-grid-actions";
import { ProfileBentoGridCard } from "@/components/profile-page/v2/profile-bento-grid-card";
import { useGridDragMotion } from "@/hooks/use-grid-drag-motion";
import { BREAKPOINTS, COLS, GRID_MARGIN, getGridRowHeight } from "@/lib/grid/grid-config";
import { normalizeLayouts } from "@/lib/grid/grid-layout-utils";
import type { GridBreakpoint, GridLayouts, ResizeOption } from "@/lib/grid/grid-types";
import type { ProfileBentoItem } from "@/lib/profile-page/types";
import {
  type CreatableBentoType,
  createAutoBentoItem,
  mergeLayoutsIntoBento,
  toBentoGridItem,
  toBentoGridLayouts,
  toBentoItemTypeById,
} from "./profile-bento-grid-model";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

type ProfileBentoInteractiveGridProps = {
  initialBento: ProfileBentoItem[];
};

export function ProfileBentoInteractiveGrid({ initialBento }: ProfileBentoInteractiveGridProps) {
  const { width, containerRef, mounted } = useContainerWidth({
    initialWidth: 864,
    measureBeforeMount: true,
  });
  const [bento, setBento] = useState(initialBento);
  const [layouts, setLayouts] = useState<GridLayouts>(() => toBentoGridLayouts(initialBento));
  const {
    activeDragItemId,
    cardRotate,
    cardX,
    isThinPlaceholderActive,
    startDrag,
    stopDrag,
    startResize,
    stopResize,
    updateDragPointer,
  } = useGridDragMotion();
  const activeBreakpoint: GridBreakpoint = width > BREAKPOINTS.desktop ? "desktop" : "compact";
  const bentoById = useMemo(() => new Map(bento.map((item) => [item.id, item] as const)), [bento]);
  const itemTypeById = useMemo(() => toBentoItemTypeById(bento), [bento]);
  const gridItems = useMemo(() => bento.map(toBentoGridItem), [bento]);
  const bentoCountLabel = useMemo(() => `${bento.length} items`, [bento.length]);
  const isSectionDragActive =
    activeDragItemId !== null && itemTypeById.get(activeDragItemId) === "section";
  const rowHeight = getGridRowHeight(width, activeBreakpoint);
  const gridClassName = `w-[380px] max-w-full lg:w-full [&_.react-draggable-dragging]:z-20! [&_.react-grid-item:not(.react-grid-placeholder)]:z-10 [&_.react-grid-item]:duration-[600ms]! [&_.react-grid-item]:ease-out! [&_.react-resizable-handle]:hidden! [&_.react-resizable-handle]:pointer-events-none! [&_.react-grid-placeholder]:z-0! [&_.react-grid-placeholder]:rounded-xl! [&_.react-grid-placeholder]:bg-secondary! [&_.react-grid-placeholder]:opacity-100! [&_.react-grid-placeholder]:shadow-[inset_0_1px_6px_rgb(0_0_0_/_0.08),inset_0_-1px_1px_rgb(255_255_255_/_0.8)]! ${isThinPlaceholderActive || isSectionDragActive ? "[&_.react-grid-placeholder]:h-[var(--thin-placeholder-height)]! [&_.react-grid-placeholder]:translate-y-[var(--thin-placeholder-offset)]!" : ""}`;
  const gridStyle = {
    "--thin-placeholder-height": `${rowHeight}px`,
    "--thin-placeholder-offset": `${rowHeight + GRID_MARGIN[1]}px`,
    "--thin-item-visible-height": `${rowHeight}px`,
  } as CSSProperties;

  const addItem = (type: CreatableBentoType) => {
    const liveBento = mergeLayoutsIntoBento(bento, layouts);
    const nextItem = createAutoBentoItem(type, liveBento);
    const nextBento = [...liveBento, nextItem];

    setBento(nextBento);
    setLayouts(toBentoGridLayouts(nextBento));
  };

  const removeItem = (id: string) => {
    setBento((currentItems) => currentItems.filter((item) => item.id !== id));
    setLayouts((currentLayouts) => ({
      desktop: (currentLayouts.desktop ?? []).filter((item) => item.i !== id),
      compact: (currentLayouts.compact ?? []).filter((item) => item.i !== id),
    }));
  };

  const resizeItem = (id: string, breakpoint: GridBreakpoint, option: ResizeOption) => {
    if (itemTypeById.get(id) === "section") {
      return;
    }

    setLayouts((currentLayouts) =>
      normalizeLayouts(
        {
          ...currentLayouts,
          [breakpoint]: (currentLayouts[breakpoint] ?? []).map((item) =>
            item.i === id ? { ...item, w: Math.min(option.w, COLS[breakpoint]), h: option.h } : item
          ),
        },
        itemTypeById
      )
    );
  };

  return (
    <section className="flex min-w-0 flex-1 flex-col items-center gap-4 lg:items-stretch">
      <header className="flex w-[380px] max-w-full flex-wrap items-center justify-between gap-3 lg:w-full">
        <ProfileBentoGridActions onAddItem={addItem} />
      </header>

      <div className={gridClassName} ref={containerRef} style={gridStyle}>
        <ResponsiveGridCanvas
          activeBreakpoint={activeBreakpoint}
          activeDragItemId={activeDragItemId}
          cardRotate={cardRotate}
          cardX={cardX}
          items={gridItems}
          layouts={layouts}
          mounted={mounted}
          onDrag={updateDragPointer}
          onDragStart={startDrag}
          onDragStop={stopDrag}
          onLayoutChange={(nextLayouts) => {
            setLayouts(normalizeLayouts(nextLayouts, itemTypeById));
          }}
          onRemoveItem={removeItem}
          onResizeItem={resizeItem}
          onResizeStart={startResize}
          onResizeStop={stopResize}
          renderItem={(gridItem) => {
            const item = bentoById.get(gridItem.id);

            return item ? <ProfileBentoGridCard item={item} layouts={layouts} /> : null;
          }}
          rowHeight={rowHeight}
          width={width}
        />
      </div>
    </section>
  );
}
