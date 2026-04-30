"use client";

import type { CSSProperties } from "react";
import { useContainerWidth } from "react-grid-layout";
import { GridToolbar } from "@/components/grid/grid-toolbar";
import { ResponsiveGridCanvas } from "@/components/grid/responsive-grid-canvas";
import { useGridDragMotion } from "@/hooks/use-grid-drag-motion";
import { useGridTestState } from "@/hooks/use-grid-test-state";
import { BREAKPOINTS, GRID_MARGIN, ROW_HEIGHT } from "@/lib/grid/grid-config";
import { normalizeLayouts } from "@/lib/grid/grid-layout-utils";
import type { GridBreakpoint } from "@/lib/grid/grid-types";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

export default function GridTest() {
  const { width, containerRef, mounted } = useContainerWidth({
    initialWidth: 864,
    measureBeforeMount: true,
  });
  const { items, layouts, addItem, removeItem, resizeItem, setLayouts } = useGridTestState();
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
  const gridClassName = `w-[380px] max-w-full lg:w-[864px] [&_.react-draggable-dragging]:z-20! [&_.react-grid-item:not(.react-grid-placeholder)]:z-10 [&_.react-grid-item]:duration-[600ms]! [&_.react-grid-item]:ease-out! [&_.react-resizable-handle]:hidden! [&_.react-resizable-handle]:pointer-events-none! [&_.react-grid-placeholder]:z-0! [&_.react-grid-placeholder]:rounded-xl! [&_.react-grid-placeholder]:bg-secondary! [&_.react-grid-placeholder]:opacity-100! [&_.react-grid-placeholder]:shadow-[inset_0_1px_6px_rgb(0_0_0_/_0.08),inset_0_-1px_1px_rgb(255_255_255_/_0.8)]! ${isThinPlaceholderActive ? "[&_.react-grid-placeholder]:h-[var(--thin-placeholder-height)]! [&_.react-grid-placeholder]:translate-y-[var(--thin-placeholder-offset)]!" : ""}`;
  const gridStyle = {
    "--thin-placeholder-height": `${ROW_HEIGHT[activeBreakpoint]}px`,
    "--thin-placeholder-offset": `${ROW_HEIGHT[activeBreakpoint] + GRID_MARGIN[1]}px`,
    "--thin-item-visible-height": `${ROW_HEIGHT[activeBreakpoint]}px`,
  } as CSSProperties;

  return (
    <div className={gridClassName} ref={containerRef} style={gridStyle}>
      <GridToolbar onAddItem={addItem} />
      <ResponsiveGridCanvas
        activeBreakpoint={activeBreakpoint}
        activeDragItemId={activeDragItemId}
        cardRotate={cardRotate}
        cardX={cardX}
        items={items}
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
        width={width}
      />
    </div>
  );
}
