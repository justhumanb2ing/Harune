import { describe, expect, test } from "bun:test";

import { getResizeOptionId, getResizeOptionsForItem } from "@/lib/grid/grid-layout-utils";
import type { GridItem, GridLayouts } from "@/lib/grid/grid-types";

describe("grid-layout-utils", () => {
  test("exposes all visible resize presets for regular link items", () => {
    const linkItem: GridItem = {
      id: "link-1",
      label: "Link",
      description: "Link widget",
      itemType: "link",
    };

    const options = getResizeOptionsForItem(linkItem);

    expect(options.map((option) => option.id)).toEqual(["1x2", "2x1", "2x2", "1x4", "2x4"]);
  });

  test("exposes explicit resize presets for spotify embed link items", () => {
    const linkItem: GridItem = {
      id: "link-1",
      label: "Link",
      description: "Link widget",
      itemType: "link",
      resizeOptionIds: ["2x2", "2x4"],
    };

    const options = getResizeOptionsForItem(linkItem);

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
