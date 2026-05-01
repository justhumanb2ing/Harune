import { TrashIcon } from "lucide-react";
import { type MotionValue, motion } from "motion/react";
import type { ReactNode } from "react";
import { useState } from "react";
import { GridResizeControls } from "@/components/grid/grid-resize-controls";
import { THIN_PLACEHOLDER_ITEM_ID } from "@/lib/grid/grid-config";
import { getResizeOptionId, getResizeOptionsForItem } from "@/lib/grid/grid-layout-utils";
import type { GridBreakpoint, GridItem, GridLayouts, ResizeOption } from "@/lib/grid/grid-types";
import { Button } from "../ui/button";

export type GridCardMotionPhase = "entering" | "exiting";

type GridCardProps = {
  activeBreakpoint: GridBreakpoint;
  cardRotate: MotionValue<number>;
  cardX: MotionValue<number>;
  isDragActive: boolean;
  item: GridItem;
  layouts: GridLayouts;
  motionPhase?: GridCardMotionPhase;
  onMotionComplete?: (id: string, phase: GridCardMotionPhase) => void;
  onRemove: (id: string) => void;
  onResize: (id: string, breakpoint: GridBreakpoint, option: ResizeOption) => void;
  readOnly?: boolean;
  trailingResizeControl?: ReactNode;
  shouldReduceMotion: boolean;
  children?: ReactNode;
};

const GRID_CARD_MOTION_EASE = [0.22, 1, 0.36, 1] as const;

function getGridCardMotion(phase: GridCardMotionPhase | undefined, shouldReduceMotion: boolean) {
  if (!phase) {
    return {};
  }

  if (shouldReduceMotion) {
    return {
      animate: { opacity: phase === "exiting" ? 0 : 1 },
      initial: phase === "entering" ? { opacity: 0 } : false,
      transition: { duration: 0.12, ease: GRID_CARD_MOTION_EASE },
    };
  }

  if (phase === "entering") {
    return {
      animate: { opacity: 1, scale: 1, y: 0 },
      initial: { opacity: 0, scale: 0.96, y: 8 },
      transition: { duration: 0.26, ease: GRID_CARD_MOTION_EASE },
    };
  }

  return {
    animate: { opacity: 0, scale: 0.96, y: -6 },
    initial: false,
    transition: { duration: 0.16, ease: GRID_CARD_MOTION_EASE },
  };
}

export function GridCard({
  activeBreakpoint,
  cardRotate,
  cardX,
  isDragActive,
  item,
  layouts,
  motionPhase,
  onMotionComplete,
  onRemove,
  onResize,
  readOnly = false,
  trailingResizeControl,
  shouldReduceMotion,
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
  const paddingClassName = item.itemType === "media" ? "p-0" : "p-3";
  const dragInteractionClassName = isDragActive
    ? "select-none [&_.grid-action]:pointer-events-none [&_.grid-action]:select-none [&_.grid-action]:!bg-transparent [&_.grid-action:focus-within]:!bg-transparent [&_.grid-action:hover]:!bg-transparent [&_input]:pointer-events-none [&_input]:select-none [&_input]:!bg-transparent [&_textarea]:pointer-events-none [&_textarea]:select-none [&_textarea]:!bg-transparent"
    : "";
  const isExiting = motionPhase === "exiting";
  const shouldShowActions = !readOnly && !isDragActive && !isExiting;
  const motionProps = getGridCardMotion(motionPhase, shouldReduceMotion);

  return (
    <motion.div
      className={`group/item relative flex w-full flex-col justify-between rounded-xl bg-white ${paddingClassName} pointer-events-auto transition-shadow ${readOnly ? "cursor-default" : "cursor-grab active:cursor-grabbing"} ${shadowClassName} ${dragInteractionClassName} ${isVisuallyThinItem ? "h-[var(--thin-item-visible-height)] " : "h-full"} ${isDragActive || motionPhase ? "will-change-transform" : ""} ${isDragActive ? "drop-shadow-xs" : ""} ${isExiting ? "pointer-events-none select-none shadow-none" : ""}`}
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
      onAnimationComplete={() => {
        if (motionPhase) {
          onMotionComplete?.(item.id, motionPhase);
        }
      }}
      style={{
        rotate: isDragActive ? cardRotate : 0,
        x: isDragActive ? cardX : 0,
        transformOrigin: "50% 70%",
      }}
      {...motionProps}
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
                className="pointer-events-none absolute -top-3 -right-3 z-10 size-9 cursor-pointer rounded-full border-[0.5px] border-border bg-background px-2 py-1 text-[10px] text-black opacity-0 shadow-sm transition-opacity hover:bg-secondary group-hover/item:pointer-events-auto group-hover/item:opacity-100 focus-visible:pointer-events-auto focus-visible:opacity-100 grid-action"
                onClick={() => {
                  onRemove(item.id);
                }}
                type="button"
              >
                <TrashIcon className="size-5 stroke-3" />
              </button>
            ) : null}
          </div>
          <p className="mt-1 text-stone-500 text-xs">{item.description}</p>
        </div>
      )}
      {children && shouldShowActions ? (
        <div className="flex items-start justify-between gap-3">
          <Button
            size="icon-lg"
            aria-label={`Remove ${item.label}`}
            className="pointer-events-none absolute -top-3 -right-3 z-10 size-9 cursor-pointer rounded-full border-[0.5px] border-border bg-background px-2 py-1 text-[10px] text-black opacity-0 shadow-sm transition-opacity hover:bg-secondary group-hover/item:pointer-events-auto group-hover/item:opacity-100 focus-visible:pointer-events-auto focus-visible:opacity-100 grid-action"
            onClick={() => {
              onRemove(item.id);
            }}
            type="button"
          >
            <TrashIcon className="size-4 stroke-3" />
          </Button>
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
          trailingControl={trailingResizeControl}
        />
      ) : null}
    </motion.div>
  );
}
