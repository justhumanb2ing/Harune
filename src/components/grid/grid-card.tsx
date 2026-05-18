import { TrashIcon } from "lucide-react";
import { type MotionStyle, type MotionValue, motion } from "motion/react";
import type { ReactNode } from "react";
import { useState } from "react";
import { GridResizeControls } from "@/components/grid/grid-resize-controls";
import {
  getBackgroundColorOption,
  getGridTextSurfaceClassNames,
  normalizeGridTextSurfaceStyle,
} from "@/components/grid/grid-text-surface";
import { GridTextSurfaceProvider } from "@/components/grid/grid-text-surface-context";
import { THIN_PLACEHOLDER_ITEM_ID } from "@/lib/grid/grid-config";
import { getResizeOptionId, getResizeOptionsForItem } from "@/lib/grid/grid-layout-utils";
import type {
  GridBreakpoint,
  GridItem,
  GridLayouts,
  GridTextSurfaceStyle,
  ResizeOption,
} from "@/lib/grid/grid-types";
import { Button } from "../ui/button";

export type GridCardMotionPhase = "entering" | "exiting";

type GridCardProps = {
  activeBreakpoint: GridBreakpoint;
  cardRotate: MotionValue<number>;
  cardX: MotionValue<number>;
  isDragIntentActive: boolean;
  isDragActive: boolean;
  item: GridItem;
  layouts: GridLayouts;
  motionPhase?: GridCardMotionPhase;
  onDragIntentStart?: (id: string) => void;
  onDragIntentStop?: (id: string) => void;
  onMotionComplete?: (id: string, phase: GridCardMotionPhase) => void;
  onRemove: (id: string) => void;
  onResize: (id: string, breakpoint: GridBreakpoint, option: ResizeOption) => void;
  onTextSurfaceChange?: (id: string, nextStyle: GridTextSurfaceStyle) => void;
  readOnly?: boolean;
  trailingResizeControl?: ReactNode;
  shouldReduceMotion: boolean;
  children?: ReactNode;
};

const GRID_CARD_MOTION_EASE = [0.22, 1, 0.36, 1] as const;
const GRID_CARD_DRAG_EASE = [0.18, 0.9, 0.22, 1] as const;

type GridCardStyle = MotionStyle & {
  "--grid-card-muted-foreground"?: string;
  "--grid-card-control-background"?: string;
  "--tw-inset-ring-color"?: string;
};

export function getGridCardMotion(
  phase: GridCardMotionPhase | undefined,
  shouldReduceMotion: boolean
) {
  if (!phase) {
    return {};
  }

  if (shouldReduceMotion) {
    return {
      animate: {
        opacity: phase === "exiting" ? 0 : 1,
      },
      initial: phase === "entering" ? { opacity: 0 } : false,
      transition: { duration: 0.12, ease: GRID_CARD_MOTION_EASE },
    };
  }

  if (phase === "entering") {
    return {
      animate: { opacity: 1, y: 0 },
      initial: { opacity: 0, y: 8 },
      transition: { duration: 0.26, ease: GRID_CARD_MOTION_EASE },
    };
  }

  return {
    animate: { opacity: 0, y: -6 },
    initial: false,
    transition: { duration: 0.16, ease: GRID_CARD_MOTION_EASE },
  };
}

export function getGridCardTapScale(
  itemType: GridItem["itemType"],
  readOnly: boolean,
  shouldReduceMotion: boolean
) {
  if (shouldReduceMotion) {
    return 1;
  }

  if (itemType === "text" && readOnly) {
    return 1;
  }

  if (itemType === "section" && readOnly) {
    return 1;
  }

  if (itemType === "text" || itemType === "section") {
    return 1.025;
  }

  return 1;
}

export function GridCard({
  activeBreakpoint,
  cardRotate,
  cardX,
  isDragIntentActive,
  isDragActive,
  item,
  layouts,
  motionPhase,
  onDragIntentStart,
  onDragIntentStop,
  onMotionComplete,
  onRemove,
  onResize,
  onTextSurfaceChange,
  readOnly = false,
  trailingResizeControl,
  shouldReduceMotion,
  children,
}: GridCardProps) {
  const isThinPlaceholderItem = item.id === THIN_PLACEHOLDER_ITEM_ID;
  const isLinkItem = item.itemType === "link";
  const isSectionItem = item.itemType === "section";
  const isVisuallyThinItem = isThinPlaceholderItem || item.itemType === "section";
  const resizeOptions = getResizeOptionsForItem(item);
  const selectedResizeOption = getResizeOptionId(layouts, activeBreakpoint, item.id);
  const [isSectionPointerActive, setIsSectionPointerActive] = useState(false);
  const [isSectionFocusActive, setIsSectionFocusActive] = useState(false);
  const textSurfaceStyle =
    item.itemType === "text" ? normalizeGridTextSurfaceStyle(item.textSurfaceStyle) : null;
  const textSurfaceBackgroundColorOption = textSurfaceStyle
    ? getBackgroundColorOption(textSurfaceStyle.backgroundColor)
    : null;
  const clockBackgroundColorOption =
    item.itemType === "clock"
      ? getBackgroundColorOption(item.clockBackgroundColor ?? "#ffffff")
      : null;
  const textSurfaceClassNames = textSurfaceStyle
    ? getGridTextSurfaceClassNames(textSurfaceStyle)
    : null;
  const isLiftActive = isDragActive || isDragIntentActive;
  const dragScale = shouldReduceMotion || !isLiftActive ? 1 : 1.025;
  const shouldShowSectionShadow =
    isSectionItem && !readOnly && (isSectionPointerActive || isSectionFocusActive || isLiftActive);
  const shadowClassName = !isSectionItem || shouldShowSectionShadow ? "shadow-xs" : "shadow-none";
  const isFullBleedItem =
    item.itemType === "media" || item.itemType === "map" || item.itemType === "clock";
  const shouldRemovePadding = isFullBleedItem || item.itemType === "text";
  const paddingClassName = shouldRemovePadding ? "p-0" : isVisuallyThinItem ? "p-2" : "p-4";
  const radiusClassName = isVisuallyThinItem ? "rounded-2xl" : "rounded-[1.5rem]";
  const bevelClassName =
    (isFullBleedItem && item.itemType !== "clock") ||
    (item.itemType === "clock" && clockBackgroundColorOption?.id !== "white") ||
    (item.itemType === "text" && textSurfaceBackgroundColorOption?.id !== "white")
      ? "surface-bevel"
      : "";
  const frameClassName = isSectionItem
    ? shouldShowSectionShadow
      ? "outline-transparent inset-ring-1"
      : "outline-none inset-ring-0"
    : item.itemType === "text"
      ? textSurfaceBackgroundColorOption?.id === "white"
        ? "outline-border/35 inset-ring-1"
        : "outline-none"
      : item.itemType === "map"
        ? "outline-border/35 inset-ring-1"
        : isFullBleedItem
          ? "outline-none"
          : "outline-border/35 inset-ring-1";
  const shellShadowClassName = shadowClassName;
  const shadowLayerClassName = isDragActive ? "shadow-float" : "";
  const dragInteractionClassName = isLiftActive
    ? "select-none [&_.grid-action]:pointer-events-none [&_.grid-action]:select-none [&_input:not(.grid-caption-input)]:pointer-events-none [&_input:not(.grid-caption-input)]:select-none [&_input:not(.grid-caption-input)]:!bg-transparent [&_textarea:not(.grid-caption-input)]:pointer-events-none [&_textarea:not(.grid-caption-input)]:select-none [&_textarea:not(.grid-caption-input)]:!bg-transparent"
    : "";
  const isExiting = motionPhase === "exiting";
  const shouldShowActions = !readOnly && !isLiftActive && !isExiting;
  const motionProps = getGridCardMotion(motionPhase, shouldReduceMotion);
  const tapScale = getGridCardTapScale(item.itemType, readOnly, shouldReduceMotion);
  const shellStyle = item.theme
    ? {
        "--grid-card-control-background": item.theme.controlBackgroundColor,
        "--grid-card-muted-foreground": item.theme.mutedForegroundColor,
        "--tw-inset-ring-color": isLinkItem
          ? `color-mix(in srgb, ${item.theme.backgroundColor} 90%, black)`
          : "color-mix(in srgb, var(--border) 80%, transparent)",
        backgroundColor: item.theme.backgroundColor,
        color: item.theme.foregroundColor,
      }
    : {
        "--tw-inset-ring-color": "color-mix(in srgb, var(--border) 80%, transparent)",
      };
  const shellBackgroundClassName =
    item.itemType === "text" && textSurfaceClassNames
      ? textSurfaceClassNames.backgroundColorClassName
      : "bg-white";

  return (
    <motion.div
      className={`group/item relative w-full pointer-events-auto ${readOnly ? "cursor-default" : "cursor-grab active:cursor-grabbing"} ${dragInteractionClassName} ${isVisuallyThinItem ? "h-[var(--thin-item-visible-height)] " : "h-full"} ${isLiftActive || motionPhase ? "will-change-transform" : ""} ${isLiftActive ? "drop-shadow-xs" : ""} ${isExiting ? "pointer-events-none select-none" : ""}`}
      data-link-provider-theme={item.theme ? "true" : undefined}
      onPointerDownCapture={(event) => {
        if (readOnly || isLiftActive) {
          return;
        }

        const target = event.target;

        if (
          !(target instanceof Element) ||
          target.closest(
            "button, input, textarea, select, a, [contenteditable='true'], [role='radio'], [data-slot='radio-group-item'], .grid-action"
          )
        ) {
          return;
        }

        onDragIntentStart?.(item.id);
      }}
      onPointerUpCapture={() => {
        if (isDragIntentActive && !isDragActive) {
          onDragIntentStop?.(item.id);
        }
      }}
      onPointerCancelCapture={() => {
        if (isDragIntentActive && !isDragActive) {
          onDragIntentStop?.(item.id);
        }
      }}
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
      whileTap={
        shouldReduceMotion || tapScale === 1
          ? undefined
          : {
              scale: tapScale,
            }
      }
      style={{ rotate: isDragActive ? cardRotate : 0, x: isDragActive ? cardX : 0 }}
      {...motionProps}
    >
      <motion.div
        animate={
          shouldReduceMotion
            ? { y: 0 }
            : {
                scale: dragScale,
                y: isLiftActive ? -6 : 0,
              }
        }
        className={`relative flex h-full min-h-0 w-full flex-col justify-between ${frameClassName} ${radiusClassName} ${shellBackgroundClassName} ${paddingClassName} transition-shadow ${bevelClassName} ${shellShadowClassName} ${isExiting ? "pointer-events-none select-none shadow-none" : ""} ${isDragActive || motionPhase ? "will-change-transform" : ""}`}
        style={
          {
            ...shellStyle,
            transformOrigin: "50% 70%",
          } satisfies GridCardStyle
        }
        transition={
          shouldReduceMotion
            ? { duration: 0.12, ease: GRID_CARD_MOTION_EASE }
            : {
                y: {
                  duration: isLiftActive ? 0.28 : 0.32,
                  ease: GRID_CARD_DRAG_EASE,
                },
                scale: {
                  duration: isLiftActive ? 0.32 : 0.36,
                  ease: GRID_CARD_DRAG_EASE,
                },
              }
        }
      >
        <div
          aria-hidden
          className={`pointer-events-none absolute inset-0 rounded-[inherit] ${shadowLayerClassName}`}
        />
        {children ? (
          <div className="min-h-0 flex-1">
            {item.itemType === "text" && textSurfaceClassNames ? (
              <div
                className={`relative flex h-full min-h-0 w-full flex-col overflow-hidden rounded-[1.5rem] ${
                  textSurfaceBackgroundColorOption?.id === "white" ? "" : "surface-bevel"
                }`}
              >
                <div className="min-h-0 flex-1 p-4">
                  <GridTextSurfaceProvider
                    backgroundColorClassName={textSurfaceClassNames.backgroundColorClassName}
                    focusVisibleBackgroundClassName={
                      textSurfaceClassNames.focusVisibleBackgroundClassName
                    }
                    foregroundClassName={textSurfaceClassNames.foregroundClassName}
                    hoverBackgroundClassName={textSurfaceClassNames.hoverBackgroundClassName}
                    textAlignClassName={textSurfaceClassNames.textAlignClassName}
                    verticalAlignClassName={textSurfaceClassNames.verticalAlignClassName}
                  >
                    {children}
                  </GridTextSurfaceProvider>
                </div>
              </div>
            ) : (
              children
            )}
          </div>
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
            onTextSurfaceChange={
              item.itemType === "text" && onTextSurfaceChange
                ? (nextStyle) => onTextSurfaceChange(item.id, nextStyle)
                : undefined
            }
            options={resizeOptions}
            selectedTextSurfaceStyle={textSurfaceStyle ?? undefined}
            selectedOptionId={selectedResizeOption}
            trailingControl={trailingResizeControl}
          />
        ) : null}
      </motion.div>
    </motion.div>
  );
}
