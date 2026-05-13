import type { LayoutItem } from "react-grid-layout";
import { createLayoutItem, normalizeLayouts } from "@/lib/grid/grid-layout-utils";
import type { GridBreakpoint, GridItem, GridLayouts } from "@/lib/grid/grid-types";
import { resolveLinkProviderTheme } from "@/lib/metadata/link-provider-theme";
import type { ProfileBentoItem, ProfileBentoLayout, ProfileBentoType } from "@/lib/profile/types";

export type CreatableBentoType = ProfileBentoType;

export const creatableBentoTypes = [
  "link",
  "text",
  "media",
  "map",
  "section",
] as const satisfies readonly CreatableBentoType[];

export const bentoTypeLabels = {
  link: "Link",
  map: "Map",
  media: "Image & Video",
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
  theme:
    item.type === "link" ? (resolveLinkProviderTheme(item.content.url) ?? undefined) : undefined,
  label:
    item.type === "text"
      ? "Text"
      : item.type === "map"
        ? item.content.caption || "Map"
        : item.type === "media"
          ? item.content.caption || "Media"
          : item.type === "section"
            ? item.content.title
            : item.content.title,
  description: item.type,
});

const getLinkDomain = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
};

export const normalizeProfileBentoItems = (items: ProfileBentoItem[]): ProfileBentoItem[] =>
  items.map((item) => {
    if (item.type !== "link") {
      return item;
    }

    return {
      ...item,
      content: {
        ...item.content,
        domain: item.content.domain || getLinkDomain(item.content.url),
      },
    };
  });

export const createPreviewDraftBentoId = (id: string) => `preview:${id}`;

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
  const id = crypto.randomUUID();
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
        title: `New link ${count}`,
        description: "",
        favicon: "https://www.google.com/s2/favicons?domain=example.com&sz=64",
        domain: "example.com",
        thumbnail: `https://picsum.photos/seed/${encodeURIComponent(id)}/640/360`,
        url: `https://example.com/link-${count}`,
        metadata: null,
      },
    } satisfies ProfileBentoItem;
  }

  if (type === "section") {
    return {
      id,
      type,
      layout: baseLayout,
      content: {
        title: `New section ${count}`,
      },
    } satisfies ProfileBentoItem;
  }

  if (type === "media") {
    return {
      id,
      type,
      layout: baseLayout,
      content: {
        mediaType: "image",
        url: "",
        objectKey: "",
        href: null,
        alt: "",
        caption: "",
      },
    } satisfies ProfileBentoItem;
  }

  if (type === "map") {
    const latitude = 37.5665;
    const longitude = 126.978;

    return {
      id,
      type,
      layout: baseLayout,
      content: {
        latitude,
        longitude,
        zoom: 13,
        caption: "",
        url: `https://www.google.com/maps?q=${latitude},${longitude}`,
      },
    } satisfies ProfileBentoItem;
  }

  return {
    id,
    type,
    layout: baseLayout,
    content: {
      content: `New text ${count}`,
    },
  } satisfies ProfileBentoItem;
}
