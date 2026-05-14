import type { GridBreakpoint, GridItem, GridLayouts, ResizeOption } from "@/lib/grid/grid-types";

export const BREAKPOINTS = {
  desktop: 795,
  compact: 0,
} satisfies Record<GridBreakpoint, number>;

export const COLS = {
  desktop: 4,
  compact: 2,
} satisfies Record<GridBreakpoint, number>;

export const GRID_MARGIN = [40, 40] as const;
export const GRID_PADDING = [0, 0] as const;

export const ROW_HEIGHT = {
  desktop: 80,
  compact: 71,
} satisfies Record<GridBreakpoint, number>;

export const RESIZE_OPTIONS: readonly ResizeOption[] = [
  { id: "1x2", w: 1, h: 2 },
  { id: "2x1", w: 2, h: 1, hiddenForItemTypes: ["map", "media", "section"] },
  { id: "2x2", w: 2, h: 2 },
  { id: "1x4", w: 1, h: 4, hiddenForItemTypes: ["section"] },
  { id: "2x4", w: 2, h: 4, hiddenForItemTypes: ["section"] },
] as const;

export function getGridRowHeight(width: number, breakpoint: GridBreakpoint) {
  const cols = COLS[breakpoint];
  const horizontalMargin = GRID_MARGIN[0];
  const verticalMargin = GRID_MARGIN[1];
  const horizontalPadding = GRID_PADDING[0] * 2;
  const columnWidth = (width - horizontalPadding - horizontalMargin * (cols - 1)) / cols;

  return Math.max(1, Math.round((columnWidth - verticalMargin) / 2));
}

export const BENTO_GRID_SIZE_CONSTRAINTS = {
  link: { minW: 1, maxW: 4, minH: 1, maxH: 4 },
  text: { minW: 1, maxW: 4, minH: 1, maxH: 4 },
  section: { minW: 4, maxW: 4, minH: 2, maxH: 2 },
  media: { minW: 1, maxW: 4, minH: 1, maxH: 4 },
  map: { minW: 1, maxW: 4, minH: 2, maxH: 4 },
} as const;

export const THIN_PLACEHOLDER_ITEM_ID = "wide-thin-placeholder";

export const INITIAL_LAYOUTS = {
  desktop: [
    { i: "profile", x: 0, y: 0, w: 2, h: 4, minW: 1, maxW: 4, minH: 1, maxH: 4, isResizable: true },
    { i: "links", x: 2, y: 0, w: 2, h: 4, minW: 1, maxW: 4, minH: 1, maxH: 4, isResizable: true },
    { i: "stats", x: 2, y: 4, w: 1, h: 4, minW: 1, maxW: 4, minH: 1, maxH: 4, isResizable: true },
    { i: "notes", x: 3, y: 4, w: 1, h: 4, minW: 1, maxW: 4, minH: 1, maxH: 4, isResizable: true },
    {
      i: THIN_PLACEHOLDER_ITEM_ID,
      x: 0,
      y: 8,
      w: 4,
      h: 2,
      minW: 4,
      maxW: 4,
      minH: 2,
      maxH: 2,
      isResizable: true,
    },
  ],
  compact: [
    { i: "profile", x: 0, y: 0, w: 2, h: 4, minW: 1, maxW: 4, minH: 1, maxH: 4, isResizable: true },
    { i: "links", x: 0, y: 4, w: 2, h: 4, minW: 1, maxW: 4, minH: 1, maxH: 4, isResizable: true },
    { i: "stats", x: 0, y: 8, w: 1, h: 4, minW: 1, maxW: 4, minH: 1, maxH: 4, isResizable: true },
    { i: "notes", x: 1, y: 8, w: 1, h: 4, minW: 1, maxW: 4, minH: 1, maxH: 4, isResizable: true },
    {
      i: THIN_PLACEHOLDER_ITEM_ID,
      x: 0,
      y: 12,
      w: 2,
      h: 2,
      minW: 2,
      maxW: 2,
      minH: 2,
      maxH: 2,
      isResizable: true,
    },
  ],
} satisfies GridLayouts;

export const INITIAL_GRID_ITEMS = [
  { id: "profile", label: "Profile", description: "Resizable hero card" },
  { id: "links", label: "Links", description: "Minimum 1 column, maximum full row" },
  { id: "stats", label: "Stats", description: "Small constrained block" },
  { id: "notes", label: "Notes", description: "Tall note block" },
  {
    id: THIN_PLACEHOLDER_ITEM_ID,
    label: "Wide thin placeholder",
    description: "Full-width h=2 item, h=1 visual placeholder",
  },
] satisfies GridItem[];
