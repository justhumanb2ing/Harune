import { describe, expect, test } from "bun:test";

import { getResizeOptionId, getResizeOptionsForItem } from "@/lib/grid/grid-layout-utils";
import type { GridItem, GridLayouts } from "@/lib/grid/grid-types";

describe("grid-layout-utils", () => {
  test("exposes the third and fifth resize presets for clock items", () => {
    const clockItem: GridItem = {
      id: "clock-1",
      label: "Clock",
      description: "Clock widget",
      itemType: "clock",
    };

    const options = getResizeOptionsForItem(clockItem);

    expect(options.map((option) => option.id)).toEqual(["2x2", "2x4"]);
  });

  test("resolves the resize option id for clock layouts", () => {
    const layouts = {
      desktop: [{ i: "clock-1", x: 0, y: 0, w: 2, h: 2 }],
      compact: [{ i: "clock-1", x: 0, y: 0, w: 2, h: 2 }],
    } satisfies GridLayouts;

    expect(getResizeOptionId(layouts, "desktop", "clock-1")).toBe("2x2");
  });
});
