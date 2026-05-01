import { type MotionValue, motion } from "motion/react";
import type { ReactNode } from "react";
import { useState } from "react";
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
  const isSectionItem = item.itemType === "section";
  const isVisuallyThinItem = isThinPlaceholderItem || item.itemType === "section";
  const resizeOptions = getResizeOptionsForItem(item);
  const selectedResizeOption = getResizeOptionId(layouts, activeBreakpoint, item.id);
  const [isSectionPointerActive, setIsSectionPointerActive] = useState(false);
  const [isSectionFocusActive, setIsSectionFocusActive] = useState(false);
  const shouldShowSectionShadow =
    isSectionItem && (isSectionPointerActive || isSectionFocusActive || isDragActive);
  const shadowClassName =
    !isSectionItem || shouldShowSectionShadow ? "shadow-float" : "shadow-none";
  const dragInteractionClassName = isDragActive
    ? "select-none [&_.grid-action]:pointer-events-none [&_.grid-action]:select-none [&_.grid-action]:!bg-transparent [&_.grid-action:focus-within]:!bg-transparent [&_.grid-action:hover]:!bg-transparent [&_input]:pointer-events-none [&_input]:select-none [&_input]:!bg-transparent [&_textarea]:pointer-events-none [&_textarea]:select-none [&_textarea]:!bg-transparent"
    : "";
  const shouldShowActions = !isDragActive;

  return (
    <motion.div
      className={`group/item relative flex w-full flex-col justify-between rounded-xl bg-white p-2 cursor-grab pointer-events-auto active:cursor-grabbing transition-shadow ${shadowClassName} ${dragInteractionClassName} ${isVisuallyThinItem ? "h-[var(--thin-item-visible-height)] " : "h-full"} ${isDragActive ? "will-change-transform drop-shadow-xs" : ""}`}
      onBlurCapture={(event) => {
        if (!isSectionItem || event.currentTarget.contains(event.relatedTarget)) {
          return;
        }

        setIsSectionFocusActive(false);
      }}
      onFocusCapture={() => {
        if (isSectionItem) {
          setIsSectionFocusActive(true);
        }
      }}
      onMouseEnter={() => {
        if (isSectionItem) {
          setIsSectionPointerActive(true);
        }
      }}
      onMouseLeave={() => {
        if (isSectionItem) {
          setIsSectionPointerActive(false);
        }
      }}
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
            {shouldShowActions ? (
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
            ) : null}
          </div>
          <p className="mt-1 text-stone-500 text-xs">{item.description}</p>
        </div>
      )}
      {children && shouldShowActions ? (
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
      {shouldShowActions && resizeOptions.length > 0 ? (
        <GridResizeControls
          item={item}
          onResize={(id, option) => {
            onResize(id, activeBreakpoint, option);
          }}
          options={resizeOptions}
          selectedOptionId={selectedResizeOption}
        />
      ) : null}
    </motion.div>
  );
}
