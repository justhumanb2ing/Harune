import {
  type LucideIcon,
  RectangleHorizontalIcon,
  RectangleVerticalIcon,
  SquareIcon,
} from "lucide-react";
import type React from "react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { GridItem, ResizeOption, ResizeOptionId } from "@/lib/grid/grid-types";
import { cn } from "@/lib/utils";

type GridResizeControlsProps = {
  item: GridItem;
  options: readonly ResizeOption[];
  selectedOptionId: ResizeOptionId | null;
  onResize: (id: string, option: ResizeOption) => void;
  trailingControl?: React.ReactNode;
};

const resizeOptionIcons = {
  "1x2": SquareIcon,
  "1x4": RectangleVerticalIcon,
  "2x1": RectangleHorizontalIcon,
  "2x2": RectangleHorizontalIcon,
  "2x4": SquareIcon,
} satisfies Record<ResizeOptionId, LucideIcon>;

const smallResizeOptionIds = new Set<ResizeOptionId>(["1x2", "2x1"]);

export function GridResizeControls({
  item,
  options,
  selectedOptionId,
  onResize,
  trailingControl,
}: GridResizeControlsProps) {
  return (
    <div className="grid-action absolute -bottom-1.5 left-1/2 z-40 flex -translate-x-1/2 translate-y-1/2 flex-nowrap items-center justify-center gap-1 rounded-lg bg-foreground/95 p-1 opacity-0 shadow-float backdrop-blur-sm transition-opacity group-hover/item:opacity-100 focus-within:opacity-100">
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
                  smallResizeOptionIds.has(option.id) ? "size-4" : "size-5"
                )}
              />
            </ToggleGroupItem>
          );
        })}
      </ToggleGroup>
      {trailingControl}
    </div>
  );
}
