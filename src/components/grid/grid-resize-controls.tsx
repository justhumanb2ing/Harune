import {
  AlignVerticalJustifyCenterIcon,
  AlignVerticalJustifyEndIcon,
  AlignVerticalJustifyStartIcon,
  EllipsisIcon,
  type LucideIcon,
  RectangleHorizontalIcon,
  RectangleVerticalIcon,
  SquareIcon,
  TextAlignCenterIcon,
  TextAlignEndIcon,
  TextAlignStartIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import {
  backgroundColorOptions,
  type GridTextSurfaceStyle,
  getBackgroundColorOption,
  normalizeGridTextSurfaceStyle,
} from "@/components/grid/grid-text-surface";
import {
  Popover,
  PopoverPanel,
  PopoverTrigger,
} from "@/components/ui/animate-ui/components/base/popover";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { GridItem, ResizeOption, ResizeOptionId } from "@/lib/grid/grid-types";
import { cn } from "@/lib/utils";

type GridResizeControlsProps = {
  item: GridItem;
  options: readonly ResizeOption[];
  selectedOptionId: ResizeOptionId | null;
  onResize: (id: string, option: ResizeOption) => void;
  selectedTextSurfaceStyle?: GridTextSurfaceStyle;
  onTextSurfaceChange?: (nextStyle: GridTextSurfaceStyle) => void;
  trailingControl?: ReactNode;
};

const resizeOptionIcons = {
  "1x2": SquareIcon,
  "2x1": RectangleHorizontalIcon,
  "2x2": RectangleHorizontalIcon,
  "1x4": RectangleVerticalIcon,
  "2x4": SquareIcon,
} satisfies Record<ResizeOptionId, LucideIcon>;

const smallResizeOptionIds = new Set<ResizeOptionId>(["1x2", "2x1"]);

export function GridResizeControls({
  item,
  options,
  selectedOptionId,
  onResize,
  selectedTextSurfaceStyle,
  onTextSurfaceChange,
  trailingControl,
}: GridResizeControlsProps) {
  const shouldShowTextSurfaceControl = item.itemType === "text";
  const [isTextSurfacePopoverOpen, setIsTextSurfacePopoverOpen] = useState(false);
  const [isBackgroundPaletteOpen, setIsBackgroundPaletteOpen] = useState(false);
  const textSurfaceStyle = normalizeGridTextSurfaceStyle(selectedTextSurfaceStyle);
  const selectedBackgroundColorOption = getBackgroundColorOption(textSurfaceStyle.backgroundColor);
  const isExpandedResizeGroup = options.length > 5;
  const resizeButtonClassName =
    "size-8 rounded-md text-primary-foreground hover:bg-primary-foreground data-[state=on]:bg-primary-foreground data-[state=on]:text-primary aria-pressed:bg-primary-foreground aria-pressed:text-primary";
  const selectedResizeOption =
    options.find((option) => option.id === selectedOptionId) ?? options[0];
  const resolvedSelectedOptionId = selectedResizeOption?.id ?? "1x2";

  return (
    <div
      className={cn(
        "grid-action absolute -bottom-1.5 left-1/2 z-40 flex -translate-x-1/2 translate-y-1/2 items-center justify-center gap-1 rounded-lg bg-foreground/95 p-1 opacity-0 shadow-float backdrop-blur-sm transition-opacity group-hover/item:opacity-100 group-has-[button[aria-expanded=true]]/item:opacity-100 focus-within:opacity-100",
        isExpandedResizeGroup ? "flex-wrap max-w-[17rem]" : "flex-nowrap"
      )}
    >
      <ToggleGroup
        aria-label={`Resize ${item.label}`}
        className={cn("justify-center", isExpandedResizeGroup ? "flex-wrap" : "flex-nowrap")}
        spacing={1}
        value={[resolvedSelectedOptionId]}
        variant="default"
      >
        {options.map((option) => {
          const Icon = resizeOptionIcons[option.id];

          return (
            <ToggleGroupItem
              aria-label={`Resize ${item.label} to ${option.id}`}
              className={resizeButtonClassName}
              key={option.id}
              onClick={() => {
                onResize(item.id, option);
              }}
              value={option.id}
            >
              <Icon
                aria-hidden
                className={cn(
                  "stroke-3",
                  smallResizeOptionIds.has(option.id) ? "size-3.5" : "size-5"
                )}
              />
            </ToggleGroupItem>
          );
        })}
      </ToggleGroup>

      {shouldShowTextSurfaceControl ? (
        <>
          <Separator
            orientation="vertical"
            className="data-vertical:my-2 data-vertical:w-[2px] rounded-lg bg-background/30"
          />
          <Popover
            open={isTextSurfacePopoverOpen}
            onOpenChange={(nextOpen) => {
              setIsTextSurfacePopoverOpen(nextOpen);

              if (!nextOpen) {
                setIsBackgroundPaletteOpen(false);
              }
            }}
          >
            <PopoverTrigger
              render={
                <Button
                  aria-label={`Open text surface options for ${item.label}`}
                  className="size-8 rounded-md border-0 bg-transparent p-0 text-primary-foreground shadow-none hover:bg-primary-foreground focus-visible:outline-none focus-visible:ring-0"
                  size="icon"
                  type="button"
                  variant="ghost"
                >
                  <EllipsisIcon aria-hidden className="size-5 stroke-2.5" />
                </Button>
              }
            />
            <PopoverPanel
              align="center"
              className="flex w-auto flex-col gap-2 overflow-hidden rounded-lg border-0 bg-foreground p-1 shadow-float"
              side="bottom"
              sideOffset={8}
            >
              <div className="flex items-center gap-1">
                <ToggleGroup
                  aria-label={`Text alignment options for ${item.label}`}
                  className="flex-nowrap"
                  multiple={false}
                  onValueChange={(nextValue) => {
                    const nextAlign = nextValue[nextValue.length - 1];

                    if (nextAlign === "start" || nextAlign === "center" || nextAlign === "end") {
                      onTextSurfaceChange?.({
                        ...textSurfaceStyle,
                        textAlign: nextAlign,
                      });
                    }
                  }}
                  size="sm"
                  spacing={1}
                  value={[textSurfaceStyle.textAlign]}
                  variant="default"
                >
                  <ToggleGroupItem
                    aria-label={`Align ${item.label} text to the start`}
                    className="size-8 rounded-md text-primary-foreground hover:bg-primary-foreground data-[state=on]:bg-primary-foreground data-[state=on]:text-primary aria-pressed:bg-primary-foreground aria-pressed:text-primary"
                    value="start"
                  >
                    <TextAlignStartIcon aria-hidden className="size-5 stroke-3" />
                  </ToggleGroupItem>
                  <ToggleGroupItem
                    aria-label={`Align ${item.label} text to the center`}
                    className="size-8 rounded-md text-primary-foreground hover:bg-primary-foreground data-[state=on]:bg-primary-foreground data-[state=on]:text-primary aria-pressed:bg-primary-foreground aria-pressed:text-primary"
                    value="center"
                  >
                    <TextAlignCenterIcon aria-hidden className="size-5 stroke-3" />
                  </ToggleGroupItem>
                  <ToggleGroupItem
                    aria-label={`Align ${item.label} text to the end`}
                    className="size-8 rounded-md text-primary-foreground hover:bg-primary-foreground data-[state=on]:bg-primary-foreground data-[state=on]:text-primary aria-pressed:bg-primary-foreground aria-pressed:text-primary"
                    value="end"
                  >
                    <TextAlignEndIcon aria-hidden className="size-5 stroke-3" />
                  </ToggleGroupItem>
                </ToggleGroup>
                <Separator
                  orientation="vertical"
                  className="data-vertical:my-2 data-vertical:w-[2px] rounded-lg bg-background/30"
                />
                <ToggleGroup
                  aria-label={`Vertical alignment options for ${item.label}`}
                  className="flex-nowrap"
                  multiple={false}
                  onValueChange={(nextValue) => {
                    const nextAlign = nextValue[nextValue.length - 1];

                    if (nextAlign === "start" || nextAlign === "center" || nextAlign === "end") {
                      onTextSurfaceChange?.({
                        ...textSurfaceStyle,
                        verticalAlign: nextAlign,
                      });
                    }
                  }}
                  size="sm"
                  spacing={1}
                  value={[textSurfaceStyle.verticalAlign]}
                  variant="default"
                >
                  <ToggleGroupItem
                    aria-label={`Align ${item.label} vertically to the start`}
                    className="size-8 rounded-md text-primary-foreground hover:bg-primary-foreground data-[state=on]:bg-primary-foreground data-[state=on]:text-primary aria-pressed:bg-primary-foreground aria-pressed:text-primary"
                    value="start"
                  >
                    <AlignVerticalJustifyStartIcon aria-hidden className="size-5 stroke-3" />
                  </ToggleGroupItem>
                  <ToggleGroupItem
                    aria-label={`Align ${item.label} vertically to the center`}
                    className="size-8 rounded-md text-primary-foreground hover:bg-primary-foreground data-[state=on]:bg-primary-foreground data-[state=on]:text-primary aria-pressed:bg-primary-foreground aria-pressed:text-primary"
                    value="center"
                  >
                    <AlignVerticalJustifyCenterIcon aria-hidden className="size-5 stroke-3" />
                  </ToggleGroupItem>
                  <ToggleGroupItem
                    aria-label={`Align ${item.label} vertically to the end`}
                    className="size-8 rounded-md text-primary-foreground hover:bg-primary-foreground data-[state=on]:bg-primary-foreground data-[state=on]:text-primary aria-pressed:bg-primary-foreground aria-pressed:text-primary"
                    value="end"
                  >
                    <AlignVerticalJustifyEndIcon aria-hidden className="size-5 stroke-3" />
                  </ToggleGroupItem>
                </ToggleGroup>
                <Separator
                  orientation="vertical"
                  className="data-vertical:my-2 data-vertical:w-[2px] rounded-lg bg-background/30"
                />
                <Button
                  aria-expanded={isBackgroundPaletteOpen}
                  aria-controls={`grid-text-background-options-${item.id}`}
                  aria-label={`Toggle background color options for ${item.label}`}
                  className="size-8 rounded-sm border-0 bg-transparent p-1 text-primary-foreground shadow-none hover:bg-background/30 focus-visible:outline-none focus-visible:ring-0"
                  onClick={() => {
                    setIsBackgroundPaletteOpen((current) => !current);
                  }}
                  size="icon"
                  type="button"
                  variant="ghost"
                >
                  <span
                    aria-hidden
                    className={cn(
                      "size-full rounded-full border border-white/20",
                      selectedBackgroundColorOption.className
                    )}
                  />
                </Button>
              </div>

              {isBackgroundPaletteOpen ? (
                <div
                  className="flex flex-col gap-2 border-t border-white/10"
                  id={`grid-text-background-options-${item.id}`}
                >
                  <RadioGroup
                    aria-label={`Background color options for ${item.label}`}
                    className="grid grid-cols-8 gap-1 p-1 pt-1.5"
                    onValueChange={(nextValue) => {
                      const nextBackgroundColorOption = backgroundColorOptions.find(
                        (option) => option.id === nextValue
                      );

                      if (!nextBackgroundColorOption) {
                        return;
                      }

                      onTextSurfaceChange?.({
                        ...textSurfaceStyle,
                        backgroundColor: nextBackgroundColorOption.value,
                      });
                    }}
                    value={selectedBackgroundColorOption.id}
                  >
                    {backgroundColorOptions.map((option) => {
                      return (
                        <RadioGroupItem
                          aria-label={option.label}
                          className={cn(
                            "size-7 shrink-0 cursor-pointer rounded-full border border-white/20 shadow-none transition-[transform,opacity] focus-visible:ring-2 focus-visible:ring-ring/50 [&_[data-slot=radio-group-indicator]]:hidden data-checked:ring-2 data-checked:ring-white/90",
                            option.className,
                            option.checkedClassName
                          )}
                          key={option.id}
                          value={option.id}
                        />
                      );
                    })}
                  </RadioGroup>
                </div>
              ) : null}
            </PopoverPanel>
          </Popover>
        </>
      ) : null}

      {trailingControl}
    </div>
  );
}
