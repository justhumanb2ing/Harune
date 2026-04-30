import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { RESIZE_OPTIONS } from "@/lib/grid/grid-config";
import type { GridItem, ResizeOption, ResizeOptionId } from "@/lib/grid/grid-types";

type GridResizeControlsProps = {
  item: GridItem;
  options: readonly ResizeOption[];
  selectedOptionId: ResizeOptionId | null;
  onResize: (id: string, option: ResizeOption) => void;
};

export function GridResizeControls({
  item,
  options,
  selectedOptionId,
  onResize,
}: GridResizeControlsProps) {
  return (
    <ToggleGroup
      aria-label={`Resize ${item.label}`}
      className="grid-action absolute right-3 bottom-3 max-w-[calc(100%-1.5rem)] flex-wrap justify-end border border-black/10 bg-white/95 p-0.5 opacity-0 shadow-xs backdrop-blur-sm transition-opacity group-hover/item:opacity-100 focus-within:opacity-100"
      onValueChange={(nextValue) => {
        const nextOption = RESIZE_OPTIONS.find((option) => option.id === nextValue[0]);

        if (nextOption) {
          onResize(item.id, nextOption);
        }
      }}
      size="sm"
      value={selectedOptionId ? [selectedOptionId] : []}
      variant="outline"
    >
      {options.map((option) => (
        <ToggleGroupItem
          aria-label={`Set ${item.label} size to ${option.id}`}
          className="h-6 min-w-8 px-1.5 text-[11px]"
          key={option.id}
          value={option.id}
        >
          {option.id}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
