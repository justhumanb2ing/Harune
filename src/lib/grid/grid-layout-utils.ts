import type { LayoutItem } from "react-grid-layout";
import { COLS, RESIZE_OPTIONS, THIN_PLACEHOLDER_ITEM_ID } from "@/lib/grid/grid-config";
import type { GridBreakpoint, GridItem, GridLayouts, ResizeOptionId } from "@/lib/grid/grid-types";

const CLOCK_RESIZE_OPTION_IDS = new Set<ResizeOptionId>(["2x2", "2x4"]);

export function snapCardHeight(height: number) {
  if (height <= 1) {
    return 1;
  }

  return height <= 3 ? 2 : 4;
}

type CreateLayoutItemOptions = {
  h?: number;
  isResizable?: boolean;
  itemType?: string;
  maxH?: number;
  maxW?: number;
  minH?: number;
  minW?: number;
  w?: number;
};

const isFullRowThinItem = (id: string) => id === THIN_PLACEHOLDER_ITEM_ID;

function getItemType(itemTypeById: ReadonlyMap<string, string> | undefined, id: string) {
  return itemTypeById?.get(id);
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

function canPlaceItem(
  occupiedCells: ReadonlySet<string>,
  x: number,
  y: number,
  w: number,
  h: number,
  cols: number
) {
  if (x + w > cols) {
    return false;
  }

  for (let nextY = y; nextY < y + h; nextY++) {
    for (let nextX = x; nextX < x + w; nextX++) {
      if (occupiedCells.has(`${nextX}:${nextY}`)) {
        return false;
      }
    }
  }

  return true;
}

function findFirstAvailablePosition(
  layout: readonly LayoutItem[],
  cols: number,
  w: number,
  h: number
) {
  const occupiedCells = getOccupiedCells(layout);
  let y = 0;

  while (true) {
    for (let x = 0; x <= cols - w; x++) {
      if (canPlaceItem(occupiedCells, x, y, w, h, cols)) {
        return { x, y };
      }
    }

    y++;
  }
}

export function normalizeLayoutItem(
  item: LayoutItem,
  breakpoint: GridBreakpoint,
  itemType?: string
): LayoutItem {
  if (isFullRowThinItem(item.i)) {
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
      isResizable: false,
    };
  }

  if (itemType === "section") {
    const cols = COLS[breakpoint];

    return {
      ...item,
      x: 0,
      w: cols,
      h: 1,
      minW: cols,
      maxW: cols,
      minH: 1,
      maxH: 1,
      isResizable: false,
    };
  }

  if (itemType === "clock") {
    return {
      ...item,
      minH: 1,
      maxH: 4,
      minW: 1,
      maxW: COLS[breakpoint],
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

export function normalizeLayouts(
  nextLayouts: GridLayouts,
  itemTypeById?: ReadonlyMap<string, string>
): GridLayouts {
  return {
    desktop: (nextLayouts.desktop ?? []).map((item) =>
      normalizeLayoutItem(item, "desktop", getItemType(itemTypeById, item.i))
    ),
    compact: (nextLayouts.compact ?? []).map((item) =>
      normalizeLayoutItem(item, "compact", getItemType(itemTypeById, item.i))
    ),
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
  if (item.id === THIN_PLACEHOLDER_ITEM_ID || item.itemType === "section") {
    return [];
  }

  if (item.resizeOptionIds) {
    const resizeOptionIds = new Set(item.resizeOptionIds);

    return RESIZE_OPTIONS.filter((option) => resizeOptionIds.has(option.id));
  }

  if (item.itemType === "clock") {
    return RESIZE_OPTIONS.filter((option) => CLOCK_RESIZE_OPTION_IDS.has(option.id));
  }

  return RESIZE_OPTIONS.filter(
    (option) => !item.itemType || !option.hiddenForItemTypes?.includes(item.itemType)
  );
}

export function getGridLayoutPixelHeight(
  layouts: GridLayouts,
  breakpoint: GridBreakpoint,
  rowHeight: number,
  verticalMargin: number
) {
  const rows = layouts[breakpoint] ?? [];

  if (rows.length === 0) {
    return 0;
  }

  const bottomRow = rows.reduce(
    (currentBottomRow, item) => Math.max(currentBottomRow, item.y + item.h),
    0
  );

  return bottomRow * rowHeight + Math.max(0, bottomRow - 1) * verticalMargin;
}

export function createLayoutItem(
  id: string,
  breakpoint: GridBreakpoint,
  layout: readonly LayoutItem[],
  options: CreateLayoutItemOptions = {}
): LayoutItem {
  const cols = COLS[breakpoint];
  const itemType = options.itemType;
  if (itemType === "section") {
    const w = cols;
    const h = 1;
    const nextPosition = findFirstAvailablePosition(layout, cols, w, h);

    return normalizeLayoutItem(
      {
        i: id,
        x: nextPosition.x,
        y: nextPosition.y,
        w,
        h,
        minW: w,
        maxW: w,
        minH: h,
        maxH: h,
        isResizable: false,
      },
      breakpoint,
      itemType
    );
  }

  const w = isFullRowThinItem(id) ? cols : Math.min(options.w ?? 1, cols);
  const h = isFullRowThinItem(id) ? 2 : (options.h ?? 2);
  const nextPosition = findFirstAvailablePosition(layout, cols, w, h);

  return normalizeLayoutItem(
    {
      i: id,
      x: nextPosition.x,
      y: nextPosition.y,
      w,
      h,
      minW: options.minW ?? w,
      maxW: options.maxW ?? cols,
      minH: options.minH ?? 1,
      maxH: options.maxH ?? 4,
      isResizable: options.isResizable ?? true,
    },
    breakpoint,
    itemType
  );
}
