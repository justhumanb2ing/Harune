import { useState } from "react";
import {
  COLS,
  INITIAL_GRID_ITEMS,
  INITIAL_LAYOUTS,
  THIN_PLACEHOLDER_ITEM_ID,
} from "@/lib/grid/grid-config";
import { createLayoutItem, normalizeLayouts } from "@/lib/grid/grid-layout-utils";
import type { GridItem, GridLayouts, ResizeOption } from "@/lib/grid/grid-types";

export function useGridTestState() {
  const [items, setItems] = useState<GridItem[]>(INITIAL_GRID_ITEMS);
  const [layouts, setLayouts] = useState<GridLayouts>(INITIAL_LAYOUTS);
  const [nextItemNumber, setNextItemNumber] = useState(INITIAL_GRID_ITEMS.length + 1);

  function addItem() {
    const id = `dynamic-${nextItemNumber}`;

    setNextItemNumber((current) => current + 1);
    setItems((currentItems) => [
      ...currentItems,
      {
        id,
        label: `Item ${nextItemNumber}`,
        description: "Dynamically added block",
      },
    ]);
    setLayouts((currentLayouts) => ({
      desktop: [
        ...(currentLayouts.desktop ?? []),
        createLayoutItem(id, "desktop", currentLayouts.desktop ?? []),
      ],
      compact: [
        ...(currentLayouts.compact ?? []),
        createLayoutItem(id, "compact", currentLayouts.compact ?? []),
      ],
    }));
  }

  function removeItem(id: string) {
    setItems((currentItems) => currentItems.filter((item) => item.id !== id));
    setLayouts((currentLayouts) => ({
      desktop: (currentLayouts.desktop ?? []).filter((item) => item.i !== id),
      compact: (currentLayouts.compact ?? []).filter((item) => item.i !== id),
    }));
  }

  function resizeItem(id: string, option: ResizeOption) {
    if (id === THIN_PLACEHOLDER_ITEM_ID) {
      return;
    }

    setLayouts((currentLayouts) =>
      normalizeLayouts({
        desktop: (currentLayouts.desktop ?? []).map((item) =>
          item.i === id ? { ...item, w: Math.min(option.w, COLS.desktop), h: option.h } : item
        ),
        compact: (currentLayouts.compact ?? []).map((item) =>
          item.i === id ? { ...item, w: Math.min(option.w, COLS.compact), h: option.h } : item
        ),
      })
    );
  }

  return {
    items,
    layouts,
    addItem,
    removeItem,
    resizeItem,
    setLayouts,
  };
}
