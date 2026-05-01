import type { GridBreakpoint, GridItem, GridLayouts, ResizeOption } from "@/lib/grid/grid-types";

export const BREAKPOINTS = {
  desktop: 819,
  compact: 0,
} satisfies Record<GridBreakpoint, number>;

export const COLS = {
  desktop: 4,
  compact: 2,
} satisfies Record<GridBreakpoint, number>;

export const GRID_MARGIN = [32, 32] as const;
export const GRID_PADDING = [0, 0] as const;

export const ROW_HEIGHT = {
  desktop: 80,
  compact: 71,
} satisfies Record<GridBreakpoint, number>;

export const RESIZE_OPTIONS: readonly ResizeOption[] = [
  { id: "1x2", w: 1, h: 2 },
  { id: "1x4", w: 1, h: 4 },
  { id: "2x2", w: 2, h: 2 },
  { id: "2x4", w: 2, h: 4 },
  { id: "2x1", w: 2, h: 1 },
  { id: "4x1", w: 4, h: 1 },
] as const;

export const BENTO_GRID_SIZE_CONSTRAINTS = {
  link: { minW: 1, maxW: 4, minH: 1, maxH: 4 },
  text: { minW: 1, maxW: 4, minH: 1, maxH: 4 },
  playlist: { minW: 1, maxW: 4, minH: 1, maxH: 4 },
  section: { minW: 1, maxW: 4, minH: 1, maxH: 2 },
} as const;

export const THIN_PLACEHOLDER_ITEM_ID = "wide-thin-placeholder";

export const INITIAL_LAYOUTS = {
  desktop: [
    { i: "profile", x: 0, y: 0, w: 2, h: 4, minW: 1, maxW: 4, minH: 1, maxH: 4, isResizable: true },
    { i: "links", x: 2, y: 0, w: 2, h: 4, minW: 1, maxW: 4, minH: 1, maxH: 4, isResizable: true },
    {
      i: "playlist",
      x: 0,
      y: 4,
      w: 2,
      h: 4,
      minW: 1,
      maxW: 4,
      minH: 1,
      maxH: 4,
      isResizable: true,
    },
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
    {
      i: "playlist",
      x: 0,
      y: 8,
      w: 2,
      h: 4,
      minW: 1,
      maxW: 4,
      minH: 1,
      maxH: 4,
      isResizable: true,
    },
    { i: "stats", x: 0, y: 12, w: 1, h: 4, minW: 1, maxW: 4, minH: 1, maxH: 4, isResizable: true },
    { i: "notes", x: 1, y: 12, w: 1, h: 4, minW: 1, maxW: 4, minH: 1, maxH: 4, isResizable: true },
    {
      i: THIN_PLACEHOLDER_ITEM_ID,
      x: 0,
      y: 16,
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
  { id: "playlist", label: "Playlist", description: "Drag and resize inside the grid" },
  { id: "stats", label: "Stats", description: "Small constrained block" },
  { id: "notes", label: "Notes", description: "Tall note block" },
  {
    id: THIN_PLACEHOLDER_ITEM_ID,
    label: "Wide thin placeholder",
    description: "Full-width h=2 item, h=1 visual placeholder",
  },
] satisfies GridItem[];
