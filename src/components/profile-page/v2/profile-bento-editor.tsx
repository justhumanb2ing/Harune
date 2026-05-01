"use client";

import type { CSSProperties } from "react";
import { useMemo, useState, useTransition } from "react";
import { useContainerWidth } from "react-grid-layout";
import { toast } from "sonner";
import { ResponsiveGridCanvas } from "@/components/grid/responsive-grid-canvas";
import { Button } from "@/components/ui/button";
import { useGridDragMotion } from "@/hooks/use-grid-drag-motion";
import { BREAKPOINTS, COLS, GRID_MARGIN, getGridRowHeight } from "@/lib/grid/grid-config";
import { createLayoutItem, normalizeLayouts } from "@/lib/grid/grid-layout-utils";
import type { GridBreakpoint, GridItem, GridLayouts, ResizeOption } from "@/lib/grid/grid-types";
import type {
  ProfileBentoItem,
  ProfileBentoType,
  PublicProfileBentoPageData,
} from "@/lib/profile-page/types";
import { apiFetch, getApiErrorDescription } from "@/lib/react-query/fetcher";
import { toBentoItemTypeById } from "./profile-bento-grid-model";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

type ProfileBentoEditorProps = {
  initialData: PublicProfileBentoPageData;
};

type EditableBentoItem = ProfileBentoItem;

const bentoTypeLabels = {
  link: "Link",
  playlist: "Playlist",
  section: "Section",
  text: "Text",
} satisfies Record<ProfileBentoType, string>;

const toGridItem = (item: EditableBentoItem): GridItem => ({
  id: item.id,
  itemType: item.type,
  label:
    item.type === "text"
      ? "Text"
      : item.type === "section"
        ? item.content.title
        : item.content.title,
  description: bentoTypeLabels[item.type],
});

const toGridLayouts = (bento: EditableBentoItem[]): GridLayouts =>
  normalizeLayouts(
    {
      desktop: bento.map((item) => ({
        i: item.id,
        ...item.layout.desktop,
      })),
      compact: bento.map((item) => ({
        i: item.id,
        ...item.layout.compact,
      })),
    },
    toBentoItemTypeById(bento)
  );

const createBentoItem = (type: ProfileBentoType, layouts: GridLayouts): EditableBentoItem => {
  const id = `draft:${crypto.randomUUID()}`;
  const layout = {
    desktop: createLayoutItem(id, "desktop", layouts.desktop ?? [], { itemType: type }),
    compact: createLayoutItem(id, "compact", layouts.compact ?? [], { itemType: type }),
  };
  const baseLayout = {
    desktop: {
      x: layout.desktop.x,
      y: layout.desktop.y,
      w: layout.desktop.w,
      h: layout.desktop.h,
    },
    compact: {
      x: layout.compact.x,
      y: layout.compact.y,
      w: layout.compact.w,
      h: layout.compact.h,
    },
  };

  if (type === "link") {
    return {
      id,
      type,
      layout: baseLayout,
      content: {
        title: "New link",
        description: "",
        favicon: "",
        thumbnail: "",
        url: "https://example.com",
      },
    };
  }

  if (type === "playlist") {
    return {
      id,
      type,
      layout: baseLayout,
      content: {
        title: "New playlist",
        provider: "Spotify",
        url: "https://open.spotify.com",
        content: "<iframe />",
      },
    };
  }

  if (type === "section") {
    return {
      id,
      type,
      layout: baseLayout,
      content: {
        title: "New section",
      },
    };
  }

  return {
    id,
    type,
    layout: baseLayout,
    content: {
      content: "New text",
    },
  };
};

const createPayload = (items: EditableBentoItem[], layouts: GridLayouts) => {
  const desktopLayouts = new Map((layouts.desktop ?? []).map((item) => [item.i, item] as const));
  const compactLayouts = new Map((layouts.compact ?? []).map((item) => [item.i, item] as const));

  return {
    bento: items.flatMap((item) => {
      const desktop = desktopLayouts.get(item.id);
      const compact = compactLayouts.get(item.id);

      if (!desktop || !compact) {
        return [];
      }

      return [
        {
          ...item,
          layout: {
            desktop: {
              x: desktop.x,
              y: desktop.y,
              w: desktop.w,
              h: desktop.h,
            },
            compact: {
              x: compact.x,
              y: compact.y,
              w: compact.w,
              h: compact.h,
            },
          },
        },
      ];
    }),
  };
};

export function ProfileBentoEditor({ initialData }: ProfileBentoEditorProps) {
  const { width, containerRef, mounted } = useContainerWidth({
    initialWidth: 864,
    measureBeforeMount: true,
  });
  const [items, setItems] = useState<EditableBentoItem[]>(initialData.bento);
  const [layouts, setLayouts] = useState<GridLayouts>(() => toGridLayouts(initialData.bento));
  const [isPending, startTransition] = useTransition();
  const {
    activeDragItemId,
    cardRotate,
    cardX,
    isThinPlaceholderActive,
    startDrag,
    stopDrag,
    startResize,
    stopResize,
    updateDragPointer,
  } = useGridDragMotion();
  const activeBreakpoint: GridBreakpoint = width > BREAKPOINTS.desktop ? "desktop" : "compact";
  const itemTypeById = useMemo(() => toBentoItemTypeById(items), [items]);
  const gridItems = useMemo(() => items.map(toGridItem), [items]);
  const isSectionDragActive =
    activeDragItemId !== null && itemTypeById.get(activeDragItemId) === "section";
  const rowHeight = getGridRowHeight(width, activeBreakpoint);
  const gridClassName = `w-[380px] max-w-full lg:w-full [&_.react-draggable-dragging]:z-20! [&_.react-grid-item:not(.react-grid-placeholder)]:z-10 [&_.react-grid-item]:duration-[600ms]! [&_.react-grid-item]:ease-out! [&_.react-resizable-handle]:hidden! [&_.react-resizable-handle]:pointer-events-none! [&_.react-grid-placeholder]:z-0! [&_.react-grid-placeholder]:rounded-xl! [&_.react-grid-placeholder]:bg-secondary! [&_.react-grid-placeholder]:opacity-100! [&_.react-grid-placeholder]:shadow-[inset_0_1px_6px_rgb(0_0_0_/_0.08),inset_0_-1px_1px_rgb(255_255_255_/_0.8)]! ${isThinPlaceholderActive || isSectionDragActive ? "[&_.react-grid-placeholder]:h-[var(--thin-placeholder-height)]! [&_.react-grid-placeholder]:translate-y-[var(--thin-placeholder-offset)]!" : ""}`;
  const gridStyle = {
    "--thin-placeholder-height": `${rowHeight}px`,
    "--thin-placeholder-offset": `${rowHeight + GRID_MARGIN[1]}px`,
    "--thin-item-visible-height": `${rowHeight}px`,
  } as CSSProperties;

  const addItem = (type: ProfileBentoType) => {
    const nextItem = createBentoItem(type, layouts);

    setItems((currentItems) => [...currentItems, nextItem]);
    setLayouts((currentLayouts) =>
      normalizeLayouts(
        {
          desktop: [
            ...(currentLayouts.desktop ?? []),
            { i: nextItem.id, ...nextItem.layout.desktop },
          ],
          compact: [
            ...(currentLayouts.compact ?? []),
            { i: nextItem.id, ...nextItem.layout.compact },
          ],
        },
        toBentoItemTypeById([...items, nextItem])
      )
    );
  };

  const removeItem = (id: string) => {
    setItems((currentItems) => currentItems.filter((item) => item.id !== id));
    setLayouts((currentLayouts) => ({
      desktop: (currentLayouts.desktop ?? []).filter((item) => item.i !== id),
      compact: (currentLayouts.compact ?? []).filter((item) => item.i !== id),
    }));
  };

  const resizeItem = (id: string, breakpoint: GridBreakpoint, option: ResizeOption) => {
    if (itemTypeById.get(id) === "section") {
      return;
    }

    setLayouts((currentLayouts) =>
      normalizeLayouts(
        {
          ...currentLayouts,
          [breakpoint]: (currentLayouts[breakpoint] ?? []).map((item) =>
            item.i === id ? { ...item, w: Math.min(option.w, COLS[breakpoint]), h: option.h } : item
          ),
        },
        itemTypeById
      )
    );
  };

  const save = () => {
    startTransition(async () => {
      try {
        const response = await apiFetch<PublicProfileBentoPageData>(
          "/api/app/profile-page/bento/sync",
          {
            method: "POST",
            cache: "no-store",
            headers: {
              "Content-Type": "application/json",
              "Cache-Control": "no-store",
            },
            body: JSON.stringify(createPayload(items, layouts)),
          }
        );

        setItems(response.bento);
        setLayouts(toGridLayouts(response.bento));
        toast("Synced");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to sync bento", {
          description: getApiErrorDescription(error),
        });
      }
    });
  };

  return (
    <main className="h-full min-h-0 overflow-y-auto px-4 py-10 sm:px-0">
      <div className="mx-auto flex min-h-full w-full max-w-4xl flex-col gap-4 pb-24">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-semibold text-3xl tracking-tight">Bento</h1>
            <p className="mt-1 text-muted-foreground text-sm">/v2/{initialData.page.handle}</p>
          </div>
          <Button disabled={isPending} onClick={save} type="button">
            {isPending ? "Saving" : "Save"}
          </Button>
        </header>

        <div className="flex flex-wrap gap-2">
          {(["link", "text", "playlist", "section"] as const).map((type) => (
            <Button key={type} onClick={() => addItem(type)} type="button" variant="outline">
              Add {bentoTypeLabels[type]}
            </Button>
          ))}
        </div>

        <div className={gridClassName} ref={containerRef} style={gridStyle}>
          <ResponsiveGridCanvas
            activeBreakpoint={activeBreakpoint}
            activeDragItemId={activeDragItemId}
            cardRotate={cardRotate}
            cardX={cardX}
            items={gridItems}
            layouts={layouts}
            mounted={mounted}
            onDrag={updateDragPointer}
            onDragStart={startDrag}
            onDragStop={stopDrag}
            onLayoutChange={(nextLayouts) => {
              setLayouts(normalizeLayouts(nextLayouts, itemTypeById));
            }}
            onRemoveItem={removeItem}
            onResizeItem={resizeItem}
            onResizeStart={startResize}
            onResizeStop={stopResize}
            rowHeight={rowHeight}
            width={width}
          />
        </div>
      </div>
    </main>
  );
}
