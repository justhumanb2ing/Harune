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
  Popover,
  PopoverPanel,
  PopoverTrigger,
} from "@/components/ui/animate-ui/components/base/popover";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { GridItem, ResizeOption, ResizeOptionId } from "@/lib/grid/grid-types";
import { cn } from "@/lib/utils";
import { Separator } from "../ui/separator";
import {
  type BackgroundColorId,
  backgroundColorOptions,
  getBackgroundColorOption,
} from "./grid-text-surface";

type GridResizeControlsProps = {
  item: GridItem;
  options: readonly ResizeOption[];
  selectedOptionId: ResizeOptionId | null;
  onResize: (id: string, option: ResizeOption) => void;
  selectedBackgroundColorId?: BackgroundColorId;
  onBackgroundColorChange?: (backgroundColorId: BackgroundColorId) => void;
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
  selectedBackgroundColorId,
  onBackgroundColorChange,
  trailingControl,
}: GridResizeControlsProps) {
  const shouldShowTextAlignmentControl = item.itemType === "text";
  const [isTextAlignmentPopoverOpen, setIsTextAlignmentPopoverOpen] = useState(false);
  const [isBackgroundPaletteOpen, setIsBackgroundPaletteOpen] = useState(false);
  const [selectedVerticalAlign, setSelectedVerticalAlign] = useState<"start" | "center" | "end">(
    "start"
  );
  const activeBackgroundColor = selectedBackgroundColorId
    ? getBackgroundColorOption(selectedBackgroundColorId)
    : backgroundColorOptions[0];

  return (
    <div className="grid-action absolute -bottom-1.5 left-1/2 z-40 flex -translate-x-1/2 translate-y-1/2 flex-nowrap items-center justify-center gap-1 rounded-lg bg-foreground/95 p-1 opacity-0 shadow-float backdrop-blur-sm transition-opacity group-hover/item:opacity-100 group-has-[button[aria-expanded=true]]/item:opacity-100 focus-within:opacity-100">
      <ToggleGroup
        aria-label={`Resize ${item.label}`}
        className="flex-nowrap justify-center"
        onValueChange={(nextValue) => {
          const nextOption = options.find((option) => option.id === nextValue[0]);

          if (nextOption) {
            onResize(item.id, nextOption);
          }
        }}
        size="sm"
        value={selectedOptionId ? [selectedOptionId] : []}
        variant="default"
        spacing={1}
      >
        {options.map((option) => {
          const Icon = resizeOptionIcons[option.id];

          return (
            <ToggleGroupItem
              aria-label={`Set ${item.label} size to ${option.id}`}
              className="size-8 text-primary-foreground hover:bg-primary-foreground data-[state=on]:bg-primary-foreground data-[state=on]:text-primary aria-pressed:bg-primary-foreground aria-pressed:text-primary"
              key={option.id}
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
      {shouldShowTextAlignmentControl ? (
        <>
          <Separator
            orientation="vertical"
            className="data-vertical:w-[2px] bg-background/30 data-vertical:my-2 rounded-lg"
          />
          <Popover
            open={isTextAlignmentPopoverOpen}
            onOpenChange={(nextOpen, _eventDetails) => {
              setIsTextAlignmentPopoverOpen(nextOpen);

              if (!nextOpen) {
                setIsBackgroundPaletteOpen(false);
              }
            }}
          >
            <PopoverTrigger
              render={
                <Button
                  aria-label={`Open text alignment options for ${item.label}`}
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
                  value={["start"]}
                  size="sm"
                  spacing={1}
                  variant="default"
                >
                  <ToggleGroupItem
                    aria-label={`Align ${item.label} text to the start`}
                    className="size-8 text-primary-foreground hover:bg-primary-foreground data-[state=on]:bg-primary-foreground data-[state=on]:text-primary aria-pressed:bg-primary-foreground aria-pressed:text-primary"
                    value="start"
                  >
                    <TextAlignStartIcon aria-hidden className="size-5 stroke-3" />
                  </ToggleGroupItem>
                  <ToggleGroupItem
                    aria-label={`Align ${item.label} text to the center`}
                    className="size-8 text-primary-foreground hover:bg-primary-foreground data-[state=on]:bg-primary-foreground data-[state=on]:text-primary aria-pressed:bg-primary-foreground aria-pressed:text-primary"
                    value="center"
                  >
                    <TextAlignCenterIcon aria-hidden className="size-5 stroke-3" />
                  </ToggleGroupItem>
                  <ToggleGroupItem
                    aria-label={`Align ${item.label} text to the end`}
                    className="size-8 text-primary-foreground hover:bg-primary-foreground data-[state=on]:bg-primary-foreground data-[state=on]:text-primary aria-pressed:bg-primary-foreground aria-pressed:text-primary"
                    value="end"
                  >
                    <TextAlignEndIcon aria-hidden className="size-5 stroke-3" />
                  </ToggleGroupItem>
                </ToggleGroup>
                <Separator
                  orientation="vertical"
                  className="data-vertical:w-[2px] bg-background/30 data-vertical:my-2 rounded-lg"
                />
                <ToggleGroup
                  aria-label={`Vertical alignment options for ${item.label}`}
                  className="flex-nowrap"
                  onValueChange={(nextValue) => {
                    const nextAlign = nextValue[0];

                    if (nextAlign === "start" || nextAlign === "center" || nextAlign === "end") {
                      setSelectedVerticalAlign(nextAlign);
                    }
                  }}
                  size="sm"
                  value={[selectedVerticalAlign]}
                  variant="default"
                  spacing={1}
                >
                  <ToggleGroupItem
                    aria-label={`Align ${item.label} vertically to the start`}
                    className="size-8 text-primary-foreground hover:bg-primary-foreground data-[state=on]:bg-primary-foreground data-[state=on]:text-primary aria-pressed:bg-primary-foreground aria-pressed:text-primary"
                    value="start"
                  >
                    <AlignVerticalJustifyStartIcon aria-hidden className="size-5 stroke-3" />
                  </ToggleGroupItem>
                  <ToggleGroupItem
                    aria-label={`Align ${item.label} vertically to the center`}
                    className="size-8 text-primary-foreground hover:bg-primary-foreground data-[state=on]:bg-primary-foreground data-[state=on]:text-primary aria-pressed:bg-primary-foreground aria-pressed:text-primary"
                    value="center"
                  >
                    <AlignVerticalJustifyCenterIcon aria-hidden className="size-5 stroke-3" />
                  </ToggleGroupItem>
                  <ToggleGroupItem
                    aria-label={`Align ${item.label} vertically to the end`}
                    className="size-8 text-primary-foreground hover:bg-primary-foreground data-[state=on]:bg-primary-foreground data-[state=on]:text-primary aria-pressed:bg-primary-foreground aria-pressed:text-primary"
                    value="end"
                  >
                    <AlignVerticalJustifyEndIcon aria-hidden className="size-5 stroke-3" />
                  </ToggleGroupItem>
                </ToggleGroup>
                <Separator
                  orientation="vertical"
                  className="data-vertical:w-[2px] bg-background/30 data-vertical:my-2 rounded-lg"
                />
                <Button
                  aria-expanded={isBackgroundPaletteOpen}
                  aria-controls={`grid-text-background-options-${item.id}`}
                  aria-label={`Toggle background color options for ${item.label}`}
                  className="size-8 border-0 rounded-sm bg-transparent p-1 text-primary-foreground shadow-none hover:bg-background/30 focus-visible:outline-none focus-visible:ring-0"
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
                      activeBackgroundColor.className
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
                      onBackgroundColorChange?.(nextValue);
                    }}
                    value={selectedBackgroundColorId ?? backgroundColorOptions[0]?.id}
                  >
                    {backgroundColorOptions.map((option) => {
                      return (
                        <RadioGroupItem
                          aria-label={option.label}
                          className={cn(
                            "size-7 shrink-0 rounded-full border border-white/20 shadow-none transition-[transform,opacity] cursor-pointer focus-visible:ring-2 focus-visible:ring-ring/50 [&_[data-slot=radio-group-indicator]]:hidden data-checked:ring-2 data-checked:ring-white/90",
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
