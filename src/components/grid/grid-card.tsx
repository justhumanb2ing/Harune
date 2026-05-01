import { type MotionValue, motion } from "motion/react";
import type { ReactNode } from "react";
import { GridResizeControls } from "@/components/grid/grid-resize-controls";
import { THIN_PLACEHOLDER_ITEM_ID } from "@/lib/grid/grid-config";
import { getResizeOptionId, getResizeOptionsForItem } from "@/lib/grid/grid-layout-utils";
import type { GridBreakpoint, GridItem, GridLayouts, ResizeOption } from "@/lib/grid/grid-types";

type GridCardProps = {
  activeBreakpoint: GridBreakpoint;
  cardRotate: MotionValue<number>;
  cardX: MotionValue<number>;
  isDragActive: boolean;
  item: GridItem;
  layouts: GridLayouts;
  onRemove: (id: string) => void;
  onResize: (id: string, breakpoint: GridBreakpoint, option: ResizeOption) => void;
  children?: ReactNode;
};

export function GridCard({
  activeBreakpoint,
  cardRotate,
  cardX,
  isDragActive,
  item,
  layouts,
  onRemove,
  onResize,
  children,
}: GridCardProps) {
  const isThinPlaceholderItem = item.id === THIN_PLACEHOLDER_ITEM_ID;
  const isVisuallyThinItem = isThinPlaceholderItem || item.itemType === "section";
  const resizeOptions = getResizeOptionsForItem(item);
  const selectedResizeOption = getResizeOptionId(layouts, activeBreakpoint, item.id);

  return (
    <motion.div
      className={`group/item relative flex w-full flex-col justify-between rounded-xl shadow-float bg-white p-2 cursor-grab pointer-events-auto active:cursor-grabbing ${isVisuallyThinItem ? "h-[var(--thin-item-visible-height)] " : "h-full"} ${isDragActive ? "will-change-transform drop-shadow-xs" : ""}`}
      style={{
        rotate: isDragActive ? cardRotate : 0,
        x: isDragActive ? cardX : 0,
        transformOrigin: "50% 70%",
      }}
    >
      {children ? (
        <div className="min-h-0 flex-1">{children}</div>
      ) : (
        <div>
          <div className="flex items-start justify-between gap-3">
            <p className="font-medium text-sm text-stone-950">{item.label}</p>
            <button
              aria-label={`Remove ${item.label}`}
              className="grid-action rounded-full bg-stone-100 px-2 py-1 text-[10px] text-stone-500 transition-colors hover:bg-red-50 hover:text-red-600"
              onClick={() => {
                onRemove(item.id);
              }}
              type="button"
            >
              Remove
            </button>
          </div>
          <p className="mt-1 text-stone-500 text-xs">{item.description}</p>
        </div>
      )}
      {children ? (
        <div className="flex items-start justify-between gap-3">
          <button
            aria-label={`Remove ${item.label}`}
            className="grid-action absolute top-3 right-3 rounded-full bg-stone-100 px-2 py-1 text-[10px] text-stone-500 opacity-0 transition-opacity hover:bg-red-50 hover:text-red-600 group-hover/item:opacity-100 focus-visible:opacity-100"
            onClick={() => {
              onRemove(item.id);
            }}
            type="button"
          >
            Remove
          </button>
        </div>
      ) : null}
      {resizeOptions.length > 0 ? (
        <GridResizeControls
          item={item}
          onResize={(id, option) => {
            onResize(id, activeBreakpoint, option);
          }}
          options={resizeOptions}
          selectedOptionId={selectedResizeOption}
        />
      ) : null}
      {resizeOptions.length > 0 ? (
        <p className="text-[10px] text-stone-400 uppercase tracking-[0.2em]">resize</p>
      ) : null}
    </motion.div>
  );
}
