import type { LayoutItem } from "react-grid-layout";
import { createLayoutItem, normalizeLayouts } from "@/lib/grid/grid-layout-utils";
import type { GridBreakpoint, GridItem, GridLayouts } from "@/lib/grid/grid-types";
import type {
  ProfileBentoItem,
  ProfileBentoLayout,
  ProfileBentoType,
} from "@/lib/profile-page/types";

export type CreatableBentoType = Exclude<ProfileBentoType, "playlist">;

export const creatableBentoTypes = [
  "link",
  "text",
  "section",
] as const satisfies readonly CreatableBentoType[];

export const bentoTypeLabels = {
  link: "Link",
  section: "Section",
  text: "Text",
} satisfies Record<CreatableBentoType, string>;

export const toBentoLayoutItems = (
  bento: ProfileBentoItem[],
  breakpoint: GridBreakpoint
): LayoutItem[] =>
  bento.map((item) => ({
    i: item.id,
    ...item.layout[breakpoint],
  }));

export const toBentoItemTypeById = (bento: ProfileBentoItem[]) =>
  new Map(bento.map((item) => [item.id, item.type] as const));

export const toProfileBentoLayout = (
  layout: LayoutItem,
  w: number,
  h: number
): ProfileBentoLayout => ({
  x: layout.x,
  y: layout.y,
  w,
  h,
});

export const getBentoLayoutLabel = (item: ProfileBentoItem) =>
  `D ${item.layout.desktop.x},${item.layout.desktop.y},${item.layout.desktop.w}x${item.layout.desktop.h} / C ${item.layout.compact.x},${item.layout.compact.y},${item.layout.compact.w}x${item.layout.compact.h}`;

export const toBentoGridLayouts = (bento: ProfileBentoItem[]): GridLayouts =>
  normalizeLayouts(
    {
      desktop: toBentoLayoutItems(bento, "desktop"),
      compact: toBentoLayoutItems(bento, "compact"),
    },
    toBentoItemTypeById(bento)
  );

export const toBentoGridItem = (item: ProfileBentoItem): GridItem => ({
  id: item.id,
  itemType: item.type,
  label:
    item.type === "text"
      ? "Text"
      : item.type === "section"
        ? item.content.title
        : item.content.title,
  description: getBentoLayoutLabel(item),
});

export const mergeLayoutsIntoBento = (items: ProfileBentoItem[], layouts: GridLayouts) => {
  const desktopLayouts = new Map((layouts.desktop ?? []).map((item) => [item.i, item] as const));
  const compactLayouts = new Map((layouts.compact ?? []).map((item) => [item.i, item] as const));

  return items.map((item) => {
    const desktop = desktopLayouts.get(item.id);
    const compact = compactLayouts.get(item.id);

    return {
      ...item,
      layout: {
        desktop: desktop
          ? { x: desktop.x, y: desktop.y, w: desktop.w, h: desktop.h }
          : item.layout.desktop,
        compact: compact
          ? { x: compact.x, y: compact.y, w: compact.w, h: compact.h }
          : item.layout.compact,
      },
    };
  });
};

export function createAutoBentoItem(type: CreatableBentoType, currentItems: ProfileBentoItem[]) {
  const id = `preview:${crypto.randomUUID()}`;
  const count = currentItems.filter((item) => item.type === type).length + 1;
  const desktopLayout = createLayoutItem(
    id,
    "desktop",
    toBentoLayoutItems(currentItems, "desktop"),
    { itemType: type }
  );
  const compactLayout = createLayoutItem(
    id,
    "compact",
    toBentoLayoutItems(currentItems, "compact"),
    { itemType: type }
  );
  const baseLayout = {
    desktop: toProfileBentoLayout(desktopLayout, desktopLayout.w, desktopLayout.h),
    compact: toProfileBentoLayout(compactLayout, compactLayout.w, compactLayout.h),
  };

  if (type === "link") {
    return {
      id,
      type,
      layout: baseLayout,
      content: {
        title: `Auto link ${count}`,
        description: "Generated from the v2 page controls.",
        favicon: "https://www.google.com/s2/favicons?domain=example.com&sz=64",
        thumbnail: `https://picsum.photos/seed/${encodeURIComponent(id)}/640/360`,
        url: `https://example.com/link-${count}`,
      },
    } satisfies ProfileBentoItem;
  }

  if (type === "section") {
    return {
      id,
      type,
      layout: baseLayout,
      content: {
        title: `Auto section ${count}`,
      },
    } satisfies ProfileBentoItem;
  }

  return {
    id,
    type,
    layout: baseLayout,
    content: {
      content: `Auto text ${count}\nGenerated from the v2 page controls.`,
    },
  } satisfies ProfileBentoItem;
}
