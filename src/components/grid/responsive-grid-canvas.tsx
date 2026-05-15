import { type MotionValue, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import type { LayoutItem } from "react-grid-layout";
import { Responsive } from "react-grid-layout";
import { fastVerticalCompactor } from "react-grid-layout/extras";
import { GridCard, type GridCardMotionPhase } from "@/components/grid/grid-card";
import {
  BREAKPOINTS,
  COLS,
  GRID_MARGIN,
  GRID_PADDING,
  THIN_PLACEHOLDER_ITEM_ID,
} from "@/lib/grid/grid-config";
import type { GridBreakpoint, GridItem, GridLayouts, ResizeOption } from "@/lib/grid/grid-types";

type ResponsiveGridCanvasProps = {
  activeBreakpoint: GridBreakpoint;
  activeDragItemId: string | null;
  activeDragIntentItemId: string | null;
  cardRotate: MotionValue<number>;
  cardX: MotionValue<number>;
  plainItemIds?: ReadonlySet<string>;
  items: GridItem[];
  layouts: GridLayouts;
  mounted: boolean;
  onDrag: (event: Event) => void;
  onDragStart: (newItem: LayoutItem | null | undefined, event: Event) => void;
  onDragStop: () => void;
  onDragIntentStart: (itemId: string) => void;
  onDragIntentStop: (itemId: string) => void;
  onItemMotionComplete?: (id: string, phase: GridCardMotionPhase) => void;
  onLayoutChange: (layouts: GridLayouts) => void;
  onRemoveItem: (id: string) => void;
  onResizeItem: (id: string, breakpoint: GridBreakpoint, option: ResizeOption) => void;
  onResizeStart: (newItem: LayoutItem | null | undefined) => void;
  onResizeStop: () => void;
  readOnly?: boolean;
  getItemMotionPhase?: (id: string) => GridCardMotionPhase | undefined;
  renderItem?: (item: GridItem) => ReactNode;
  renderTrailingResizeControl?: (item: GridItem) => ReactNode;
  rowHeight: number;
  width: number;
};

export function ResponsiveGridCanvas({
  activeBreakpoint,
  activeDragItemId,
  activeDragIntentItemId,
  cardRotate,
  cardX,
  plainItemIds,
  items,
  layouts,
  mounted,
  onDrag,
  onDragStart,
  onDragStop,
  onDragIntentStart,
  onDragIntentStop,
  onItemMotionComplete,
  onLayoutChange,
  onRemoveItem,
  onResizeItem,
  onResizeStart,
  onResizeStop,
  readOnly = false,
  getItemMotionPhase,
  renderItem,
  renderTrailingResizeControl,
  rowHeight,
  width,
}: ResponsiveGridCanvasProps) {
  const shouldReduceMotion = Boolean(useReducedMotion());

  void mounted;

  // if (!mounted) {
  //   return <Skeleton className="h-dvh rounded-2xl" />;
  // }

  return (
    <Responsive<GridBreakpoint>
      autoSize
      breakpoints={BREAKPOINTS}
      className="rounded-2xl"
      cols={COLS}
      compactor={fastVerticalCompactor}
      containerPadding={GRID_PADDING}
      dragConfig={{ bounded: false, cancel: ".grid-action", enabled: !readOnly }}
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
      rowHeight={rowHeight}
      width={width}
    >
      {items.map((item) => {
        const isPlainItem = plainItemIds?.has(item.id) ?? false;
        const isSectionItem = item.itemType === "section";
        const isVisuallyThinItem = item.id === THIN_PLACEHOLDER_ITEM_ID || isSectionItem;
        const isDragActive = activeDragItemId === item.id;
        const isDragIntentActive = activeDragIntentItemId === item.id;
        const motionPhase = getItemMotionPhase?.(item.id);
        const radiusClassName = isVisuallyThinItem ? "rounded-2xl" : "rounded-[1.5rem]";

        if (isPlainItem) {
          return (
            <div
              className={`overflow-visible ${radiusClassName} ${isVisuallyThinItem ? "flex items-end" : ""}`}
              data-profile-bento-grid-item-id={item.id}
              key={item.id}
            >
              {renderItem?.(item)}
            </div>
          );
        }

        return (
          <div
            className={`overflow-visible ${radiusClassName} ${isVisuallyThinItem ? "flex items-end" : ""} ${item.id === THIN_PLACEHOLDER_ITEM_ID ? "pointer-events-none" : ""}`}
            data-profile-bento-grid-item-id={item.id}
            key={item.id}
          >
            <GridCard
              activeBreakpoint={activeBreakpoint}
              cardRotate={cardRotate}
              cardX={cardX}
              isDragIntentActive={isDragIntentActive}
              isDragActive={isDragActive}
              item={item}
              layouts={layouts}
              motionPhase={motionPhase}
              onDragIntentStart={onDragIntentStart}
              onDragIntentStop={onDragIntentStop}
              onMotionComplete={onItemMotionComplete}
              onRemove={onRemoveItem}
              onResize={onResizeItem}
              readOnly={readOnly}
              shouldReduceMotion={shouldReduceMotion}
              trailingResizeControl={renderTrailingResizeControl?.(item)}
            >
              {renderItem?.(item)}
            </GridCard>
          </div>
        );
      })}
    </Responsive>
  );
}
