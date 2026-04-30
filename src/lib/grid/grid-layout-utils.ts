import type { LayoutItem } from "react-grid-layout";
import { COLS, RESIZE_OPTIONS, THIN_PLACEHOLDER_ITEM_ID } from "@/lib/grid/grid-config";
import type { GridBreakpoint, GridItem, GridLayouts, ResizeOptionId } from "@/lib/grid/grid-types";

export function snapCardHeight(height: number) {
  if (height <= 1) {
    return 1;
  }

  return height <= 3 ? 2 : 4;
}

export function normalizeLayoutItem(item: LayoutItem, breakpoint: GridBreakpoint): LayoutItem {
  if (item.i === THIN_PLACEHOLDER_ITEM_ID) {
    const cols = COLS[breakpoint];

    return {
      ...item,
      x: 0,
      w: cols,
      h: 2,
      minW: cols,
      maxW: cols,
      minH: 2,
      maxH: 2,
      isResizable: true,
    };
  }

  return {
    ...item,
    h: snapCardHeight(item.h),
    minH: 1,
    maxH: 4,
    isResizable: true,
  };
}

export function normalizeLayouts(nextLayouts: GridLayouts): GridLayouts {
  return {
    desktop: (nextLayouts.desktop ?? []).map((item) => normalizeLayoutItem(item, "desktop")),
    compact: (nextLayouts.compact ?? []).map((item) => normalizeLayoutItem(item, "compact")),
  };
}

export function getLayoutItemSize(layouts: GridLayouts, breakpoint: GridBreakpoint, id: string) {
  const item = layouts[breakpoint]?.find((layoutItem) => layoutItem.i === id);

  return {
    w: item?.w ?? 1,
    h: item?.h ?? 1,
  };
}

export function getResizeOptionId(
  layouts: GridLayouts,
  breakpoint: GridBreakpoint,
  id: string
): ResizeOptionId | null {
  const size = getLayoutItemSize(layouts, breakpoint, id);
  const option = RESIZE_OPTIONS.find(
    (resizeOption) => resizeOption.w === size.w && resizeOption.h === size.h
  );

  return option?.id ?? null;
}

export function getResizeOptionsForItem(item: GridItem) {
  return RESIZE_OPTIONS.filter(
    (option) => !item.itemType || !option.hiddenForItemTypes?.includes(item.itemType)
  );
}

function getOccupiedCells(layout: readonly LayoutItem[]) {
  const occupiedCells = new Set<string>();

  for (const item of layout) {
    for (let y = item.y; y < item.y + item.h; y++) {
      for (let x = item.x; x < item.x + item.w; x++) {
        occupiedCells.add(`${x}:${y}`);
      }
    }
  }

  return occupiedCells;
}

function findFirstEmptyCell(layout: readonly LayoutItem[], cols: number) {
  const occupiedCells = getOccupiedCells(layout);
  let y = 0;

  while (true) {
    for (let x = 0; x < cols; x++) {
      if (!occupiedCells.has(`${x}:${y}`)) {
        return { x, y };
      }
    }

    y++;
  }
}

export function createLayoutItem(
  id: string,
  breakpoint: GridBreakpoint,
  layout: readonly LayoutItem[]
): LayoutItem {
  const cols = COLS[breakpoint];
  const nextPosition = findFirstEmptyCell(layout, cols);

  return {
    i: id,
    x: nextPosition.x,
    y: nextPosition.y,
    w: 1,
    h: 2,
    minW: 1,
    maxW: 4,
    minH: 1,
    maxH: 4,
    isResizable: true,
  };
}
