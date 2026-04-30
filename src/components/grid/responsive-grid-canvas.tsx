import type { MotionValue } from "motion/react";
import type { LayoutItem } from "react-grid-layout";
import { Responsive } from "react-grid-layout";
import { fastVerticalCompactor } from "react-grid-layout/extras";
import { GridCard } from "@/components/grid/grid-card";
import { BREAKPOINTS, COLS, GRID_MARGIN, GRID_PADDING, ROW_HEIGHT } from "@/lib/grid/grid-config";
import type { GridBreakpoint, GridItem, GridLayouts, ResizeOption } from "@/lib/grid/grid-types";

type ResponsiveGridCanvasProps = {
  activeBreakpoint: GridBreakpoint;
  activeDragItemId: string | null;
  cardRotate: MotionValue<number>;
  cardX: MotionValue<number>;
  items: GridItem[];
  layouts: GridLayouts;
  mounted: boolean;
  onDrag: (event: Event) => void;
  onDragStart: (newItem: LayoutItem | null | undefined, event: Event) => void;
  onDragStop: () => void;
  onLayoutChange: (layouts: GridLayouts) => void;
  onRemoveItem: (id: string) => void;
  onResizeItem: (id: string, option: ResizeOption) => void;
  onResizeStart: (newItem: LayoutItem | null | undefined) => void;
  onResizeStop: () => void;
  width: number;
};

export function ResponsiveGridCanvas({
  activeBreakpoint,
  activeDragItemId,
  cardRotate,
  cardX,
  items,
  layouts,
  mounted,
  onDrag,
  onDragStart,
  onDragStop,
  onLayoutChange,
  onRemoveItem,
  onResizeItem,
  onResizeStart,
  onResizeStop,
  width,
}: ResponsiveGridCanvasProps) {
  if (!mounted) {
    return <div className="h-96 rounded-[2rem] border border-black/10" />;
  }

  return (
    <Responsive<GridBreakpoint>
      autoSize
      breakpoints={BREAKPOINTS}
      className="rounded-[2rem] border border-black/10 shadow-sm"
      cols={COLS}
      compactor={fastVerticalCompactor}
      containerPadding={GRID_PADDING}
      dragConfig={{ bounded: false, cancel: ".grid-action", enabled: true }}
      layouts={layouts}
      margin={GRID_MARGIN}
      maxRows={48}
      onDrag={(_, __, ___, ____, event) => {
        onDrag(event);
      }}
      onDragStart={(_, __, newItem, ___, event) => {
        onDragStart(newItem, event);
      }}
      onDragStop={onDragStop}
      onLayoutChange={(_, nextLayouts) => {
        onLayoutChange(nextLayouts);
      }}
      onResizeStart={(_, __, newItem) => {
        onResizeStart(newItem);
      }}
      onResizeStop={onResizeStop}
      resizeConfig={{ enabled: false }}
      rowHeight={ROW_HEIGHT[activeBreakpoint]}
      width={width}
    >
      {items.map((item) => (
        <GridCard
          activeBreakpoint={activeBreakpoint}
          cardRotate={cardRotate}
          cardX={cardX}
          isDragActive={activeDragItemId === item.id}
          item={item}
          key={item.id}
          layouts={layouts}
          onRemove={onRemoveItem}
          onResize={onResizeItem}
        />
      ))}
    </Responsive>
  );
}
