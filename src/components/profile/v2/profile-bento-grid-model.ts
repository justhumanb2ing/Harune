import type { LayoutItem } from "react-grid-layout";
import { normalizeGridTextSurfaceStyle } from "@/components/grid/grid-text-surface";
import { createLayoutItem, normalizeLayouts } from "@/lib/grid/grid-layout-utils";
import type { GridBreakpoint, GridItem, GridLayouts } from "@/lib/grid/grid-types";
import { resolveLinkProviderTheme } from "@/lib/metadata/link-provider-theme";
import { getSpotifyProviderEmbedUri } from "@/lib/metadata/url-metadata";
import { getDefaultClockWidgetConfig, normalizeClockWidgetConfig } from "@/lib/profile/clock";
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
  clock: "Clock",
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
  isFullBleed:
    item.type === "link" &&
    Boolean(getSpotifyProviderEmbedUri(item.content.metadata?.providerMetadata)),
  clockBackgroundColor:
    item.type === "clock"
      ? normalizeClockWidgetConfig(item.content).style.backgroundColor
      : undefined,
  theme:
    item.type === "link" ? (resolveLinkProviderTheme(item.content.url) ?? undefined) : undefined,
  textSurfaceStyle:
    item.type === "text" ? normalizeGridTextSurfaceStyle(item.content.style) : undefined,
  textUrl: item.type === "text" ? item.content.url : undefined,
  label:
    item.type === "clock"
      ? "Clock"
      : item.type === "text"
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

export function isSpotifyLinkUrl(url: string) {
  return resolveLinkProviderTheme(url)?.provider === "spotify";
}

const getLinkDomain = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
};

export const normalizeProfileBentoItems = (items: ProfileBentoItem[]): ProfileBentoItem[] =>
  items.map((item) => {
    if (item.type === "clock") {
      return {
        ...item,
        content: normalizeClockWidgetConfig(item.content),
      };
    }

    if (item.type !== "link") {
      if (item.type !== "text") {
        return item;
      }

      return {
        ...item,
        content: {
          ...item.content,
          url: item.content.url?.trim() || null,
          style: normalizeGridTextSurfaceStyle(item.content.style),
        },
      };
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

export function createAutoBentoItem(
  type: CreatableBentoType,
  currentItems: ProfileBentoItem[],
  options: CreateAutoBentoItemOptions = {}
) {
  return createAutoBentoItemWithLayouts(type, currentItems, options);
}

type CreateAutoBentoItemLayoutOverride = {
  h?: number;
  maxH?: number;
  maxW?: number;
  minH?: number;
  minW?: number;
  w?: number;
};

type CreateAutoBentoItemOptions = {
  layoutOverrides?: Partial<Record<GridBreakpoint, CreateAutoBentoItemLayoutOverride>>;
};

function createAutoBentoLayout(
  id: string,
  breakpoint: GridBreakpoint,
  layout: readonly LayoutItem[],
  itemType: CreatableBentoType,
  options?: CreateAutoBentoItemOptions
) {
  const override = options?.layoutOverrides?.[breakpoint];

  return createLayoutItem(id, breakpoint, layout, {
    itemType,
    ...override,
  });
}

export function createAutoBentoItemWithLayouts(
  type: CreatableBentoType,
  currentItems: ProfileBentoItem[],
  options: CreateAutoBentoItemOptions = {}
) {
  const id = crypto.randomUUID();
  const count = currentItems.filter((item) => item.type === type).length + 1;
  const desktopLayout =
    type === "clock"
      ? createAutoBentoLayout(id, "desktop", toBentoLayoutItems(currentItems, "desktop"), type, {
          layoutOverrides: {
            desktop: { h: 2, minH: 1, minW: 1, w: 2 },
          },
        })
      : createAutoBentoLayout(id, "desktop", toBentoLayoutItems(currentItems, "desktop"), type, {
          layoutOverrides: options.layoutOverrides,
        });
  const compactLayout =
    type === "clock"
      ? createAutoBentoLayout(id, "compact", toBentoLayoutItems(currentItems, "compact"), type, {
          layoutOverrides: {
            compact: { h: 2, minH: 1, minW: 1, w: 2 },
          },
        })
      : createAutoBentoLayout(id, "compact", toBentoLayoutItems(currentItems, "compact"), type, {
          layoutOverrides: options.layoutOverrides,
        });
  const baseLayout = {
    desktop: toProfileBentoLayout(desktopLayout, desktopLayout.w, desktopLayout.h),
    compact: toProfileBentoLayout(compactLayout, compactLayout.w, compactLayout.h),
  };

  if (type === "clock") {
    const defaultConfig = getDefaultClockWidgetConfig();

    return {
      id,
      type,
      layout: baseLayout,
      content: {
        ...defaultConfig,
      },
    } satisfies ProfileBentoItem;
  }

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
      url: null,
      style: normalizeGridTextSurfaceStyle(null),
    },
  } satisfies ProfileBentoItem;
}
