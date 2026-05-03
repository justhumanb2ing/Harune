import type { ResponsiveLayouts } from "react-grid-layout";

export type GridItemTheme = {
  backgroundColor: string;
  foregroundColor: string;
  mutedForegroundColor: string;
  controlBackgroundColor: string;
};

export type GridBreakpoint = "desktop" | "compact";

export type GridItem = {
  id: string;
  label: string;
  description: string;
  itemType?: string;
  theme?: GridItemTheme;
};

export type ResizeOptionId = "1x2" | "1x4" | "2x2" | "2x4" | "2x1";

export type ResizeOption = {
  id: ResizeOptionId;
  w: number;
  h: number;
  hiddenForItemTypes?: readonly string[];
};

export type GridLayouts = ResponsiveLayouts<GridBreakpoint>;
