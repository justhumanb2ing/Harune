import { type MotionValue, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import type { LayoutItem } from "react-grid-layout";
import { Responsive } from "react-grid-layout";
import { fastVerticalCompactor } from "react-grid-layout/extras";
import {
  GRID_CARD_INTERACTIVE_TARGET_SELECTOR,
  GridCard,
  type GridCardMotionPhase,
} from "@/components/grid/grid-card";
import {
  BREAKPOINTS,
  COLS,
  GRID_MARGIN,
  GRID_PADDING,
  THIN_PLACEHOLDER_ITEM_ID,
} from "@/lib/grid/grid-config";
import type {
  GridBreakpoint,
  GridItem,
  GridLayouts,
  GridTextSurfaceStyle,
  ResizeOption,
} from "@/lib/grid/grid-types";

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
  onTextSurfaceChange?: (id: string, nextStyle: GridTextSurfaceStyle) => void;
  onTextUrlChange?: (id: string, nextUrl: string | null) => void;
  onResizeStart: (newItem: LayoutItem | null | undefined) => void;
  onResizeStop: () => void;
  readOnly?: boolean;
  getItemMotionPhase?: (id: string) => GridCardMotionPhase | undefined;
  renderItem?: (item: GridItem) => ReactNode;
  renderItemShell?: (item: GridItem, children: ReactNode) => ReactNode;
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
  onTextSurfaceChange,
  onTextUrlChange,
  onResizeStart,
  onResizeStop,
  readOnly = false,
  getItemMotionPhase,
  renderItem,
  renderItemShell,
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
      dragConfig={{
        bounded: false,
        cancel: GRID_CARD_INTERACTIVE_TARGET_SELECTOR,
        enabled: !readOnly,
      }}
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
        const isVisuallyThinItem = item.id === THIN_PLACEHOLDER_ITEM_ID;
        const isDragActive = activeDragItemId === item.id;
        const isDragIntentActive = activeDragIntentItemId === item.id;
        const motionPhase = getItemMotionPhase?.(item.id);
        const radiusClassName = isVisuallyThinItem ? "rounded-2xl" : "rounded-[1.5rem]";
        const sectionItemTopMarginClassName = isSectionItem
          ? "mt-[var(--section-item-top-margin)]"
          : "";

        if (isPlainItem) {
          const content = renderItem?.(item);

          return (
            <div
              className={`relative overflow-visible ${radiusClassName} ${isVisuallyThinItem ? "flex items-end" : ""} ${sectionItemTopMarginClassName}`}
              data-profile-bento-grid-item-id={item.id}
              key={item.id}
            >
              {renderItemShell ? renderItemShell(item, content) : content}
            </div>
          );
        }

        const content = (
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
            onTextSurfaceChange={onTextSurfaceChange}
            onTextUrlChange={onTextUrlChange}
            readOnly={readOnly}
            shouldReduceMotion={shouldReduceMotion}
            trailingResizeControl={renderTrailingResizeControl?.(item)}
          >
            {renderItem?.(item)}
          </GridCard>
        );

        return (
          <div
            className={`relative overflow-visible ${radiusClassName} ${isVisuallyThinItem ? "flex items-end" : ""} ${sectionItemTopMarginClassName} ${item.id === THIN_PLACEHOLDER_ITEM_ID ? "pointer-events-none" : ""}`}
            data-profile-bento-grid-item-id={item.id}
            key={item.id}
          >
            {renderItemShell ? renderItemShell(item, content) : content}
          </div>
        );
      })}
    </Responsive>
  );
}
