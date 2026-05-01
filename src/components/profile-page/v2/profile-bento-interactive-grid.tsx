"use client";

import type { CSSProperties } from "react";
import { useMemo, useState } from "react";
import { useContainerWidth } from "react-grid-layout";
import { ResponsiveGridCanvas } from "@/components/grid/responsive-grid-canvas";
import { ProfileBentoGridActions } from "@/components/profile-page/v2/profile-bento-grid-actions";
import { ProfileBentoGridCard } from "@/components/profile-page/v2/profile-bento-grid-card";
import { useGridDragMotion } from "@/hooks/use-grid-drag-motion";
import { BREAKPOINTS, COLS, GRID_MARGIN, ROW_HEIGHT } from "@/lib/grid/grid-config";
import { normalizeLayouts } from "@/lib/grid/grid-layout-utils";
import type { GridBreakpoint, GridLayouts, ResizeOption } from "@/lib/grid/grid-types";
import type { ProfileBentoItem } from "@/lib/profile-page/types";
import {
  type CreatableBentoType,
  createAutoBentoItem,
  mergeLayoutsIntoBento,
  toBentoGridItem,
  toBentoGridLayouts,
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
  const gridItems = useMemo(() => bento.map(toBentoGridItem), [bento]);
  const bentoCountLabel = useMemo(() => `${bento.length} items`, [bento.length]);
  const gridClassName = `w-full max-w-full [&_.react-draggable-dragging]:z-20! [&_.react-grid-item:not(.react-grid-placeholder)]:z-10 [&_.react-grid-item]:duration-[600ms]! [&_.react-grid-item]:ease-out! [&_.react-resizable-handle]:hidden! [&_.react-resizable-handle]:pointer-events-none! [&_.react-grid-placeholder]:z-0! [&_.react-grid-placeholder]:rounded-xl! [&_.react-grid-placeholder]:bg-secondary! [&_.react-grid-placeholder]:opacity-100! [&_.react-grid-placeholder]:shadow-[inset_0_1px_6px_rgb(0_0_0_/_0.08),inset_0_-1px_1px_rgb(255_255_255_/_0.8)]! ${isThinPlaceholderActive ? "[&_.react-grid-placeholder]:h-[var(--thin-placeholder-height)]! [&_.react-grid-placeholder]:translate-y-[var(--thin-placeholder-offset)]!" : ""}`;
  const gridStyle = {
    "--thin-placeholder-height": `${ROW_HEIGHT[activeBreakpoint]}px`,
    "--thin-placeholder-offset": `${ROW_HEIGHT[activeBreakpoint] + GRID_MARGIN[1]}px`,
    "--thin-item-visible-height": `${ROW_HEIGHT[activeBreakpoint]}px`,
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

  const resizeItem = (id: string, option: ResizeOption) => {
    setLayouts((currentLayouts) =>
      normalizeLayouts({
        desktop: (currentLayouts.desktop ?? []).map((item) =>
          item.i === id ? { ...item, w: Math.min(option.w, COLS.desktop), h: option.h } : item
        ),
        compact: (currentLayouts.compact ?? []).map((item) =>
          item.i === id ? { ...item, w: Math.min(option.w, COLS.compact), h: option.h } : item
        ),
      })
    );
  };

  return (
    <section className="flex min-w-0 flex-1 flex-col gap-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold text-2xl tracking-tight">Grid</h2>
          <p className="mt-1 text-muted-foreground text-sm">{bentoCountLabel}</p>
        </div>
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
            setLayouts(normalizeLayouts(nextLayouts));
          }}
          onRemoveItem={removeItem}
          onResizeItem={resizeItem}
          onResizeStart={startResize}
          onResizeStop={stopResize}
          renderItem={(gridItem) => {
            const item = bentoById.get(gridItem.id);

            return item ? <ProfileBentoGridCard item={item} layouts={layouts} /> : null;
          }}
          width={width}
        />
      </div>
    </section>
  );
}
