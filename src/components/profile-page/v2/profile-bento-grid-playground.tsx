"use client";

import Image from "next/image";
import type { CSSProperties } from "react";
import { useMemo, useState } from "react";
import { type LayoutItem, useContainerWidth } from "react-grid-layout";
import { ResponsiveGridCanvas } from "@/components/grid/responsive-grid-canvas";
import { PlaylistIframe } from "@/components/profile-page/playlist-iframe";
import { Button } from "@/components/ui/button";
import { useGridDragMotion } from "@/hooks/use-grid-drag-motion";
import { BREAKPOINTS, COLS, GRID_MARGIN, ROW_HEIGHT } from "@/lib/grid/grid-config";
import { createLayoutItem, normalizeLayouts } from "@/lib/grid/grid-layout-utils";
import type { GridBreakpoint, GridItem, GridLayouts, ResizeOption } from "@/lib/grid/grid-types";
import type {
  ProfileBentoItem,
  ProfileBentoLayout,
  ProfileBentoType,
} from "@/lib/profile-page/types";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

type CreatableBentoType = Exclude<ProfileBentoType, "playlist">;

type ProfileBentoGridPlaygroundProps = {
  initialBento: ProfileBentoItem[];
};

const creatableTypes = ["link", "text", "section"] as const satisfies readonly CreatableBentoType[];

const typeLabels = {
  link: "Link",
  section: "Section",
  text: "Text",
} satisfies Record<CreatableBentoType, string>;

const toLayoutItems = (bento: ProfileBentoItem[], breakpoint: GridBreakpoint): LayoutItem[] =>
  bento.map((item) => ({
    i: item.id,
    ...item.layout[breakpoint],
  }));

const toProfileLayout = (layout: LayoutItem, w: number, h: number): ProfileBentoLayout => ({
  x: layout.x,
  y: layout.y,
  w,
  h,
});

const layoutLabel = (item: ProfileBentoItem) =>
  `D ${item.layout.desktop.x},${item.layout.desktop.y},${item.layout.desktop.w}x${item.layout.desktop.h} / C ${item.layout.compact.x},${item.layout.compact.y},${item.layout.compact.w}x${item.layout.compact.h}`;

const toGridLayouts = (bento: ProfileBentoItem[]): GridLayouts =>
  normalizeLayouts({
    desktop: toLayoutItems(bento, "desktop"),
    compact: toLayoutItems(bento, "compact"),
  });

const toGridItem = (item: ProfileBentoItem): GridItem => ({
  id: item.id,
  itemType: item.type,
  label:
    item.type === "text"
      ? "Text"
      : item.type === "section"
        ? item.content.title
        : item.content.title,
  description: layoutLabel(item),
});

const mergeLayoutsIntoBento = (items: ProfileBentoItem[], layouts: GridLayouts) => {
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

function createAutoBentoItem(type: CreatableBentoType, currentItems: ProfileBentoItem[]) {
  const id = `preview:${crypto.randomUUID()}`;
  const count = currentItems.filter((item) => item.type === type).length + 1;
  const desktopLayout = createLayoutItem(id, "desktop", toLayoutItems(currentItems, "desktop"));
  const compactLayout = createLayoutItem(id, "compact", toLayoutItems(currentItems, "compact"));
  const baseLayout = {
    desktop: toProfileLayout(desktopLayout, Math.min(2, COLS.desktop), 2),
    compact: toProfileLayout(compactLayout, Math.min(2, COLS.compact), 2),
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
      layout: {
        desktop: { ...baseLayout.desktop, h: 1 },
        compact: { ...baseLayout.compact, h: 1 },
      },
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

function LayoutBadge({ item, layouts }: { item: ProfileBentoItem; layouts: GridLayouts }) {
  const liveItem = mergeLayoutsIntoBento([item], layouts)[0] ?? item;

  return (
    <span className="pointer-events-none absolute top-2 right-2 rounded-full bg-background/90 px-2 py-1 font-mono text-[10px] text-muted-foreground shadow-sm">
      {layoutLabel(liveItem)}
    </span>
  );
}

function ProfileBentoCard({ item, layouts }: { item: ProfileBentoItem; layouts: GridLayouts }) {
  if (item.type === "link") {
    return (
      <a
        className="relative flex size-full min-h-0 flex-col overflow-hidden rounded-lg transition-colors hover:bg-muted/40"
        href={item.content.url}
        onClick={(event) => event.preventDefault()}
        rel="noreferrer"
        target="_blank"
      >
        <LayoutBadge item={item} layouts={layouts} />
        {item.content.thumbnail ? (
          <div className="relative h-24 w-full shrink-0 overflow-hidden">
            <Image
              alt=""
              className="object-cover"
              fill
              sizes="(min-width: 1024px) 25vw, 50vw"
              src={item.content.thumbnail}
            />
          </div>
        ) : null}
        <div className="flex min-h-0 flex-1 flex-col gap-2 p-4">
          <div className="flex min-w-0 items-center gap-2">
            {item.content.favicon ? (
              <Image
                alt=""
                className="shrink-0 rounded-sm"
                height={20}
                src={item.content.favicon}
                unoptimized
                width={20}
              />
            ) : null}
            <h2 className="truncate font-medium text-sm">{item.content.title}</h2>
          </div>
          {item.content.description ? (
            <p className="line-clamp-3 text-muted-foreground text-sm leading-6">
              {item.content.description}
            </p>
          ) : null}
        </div>
      </a>
    );
  }

  if (item.type === "text") {
    return (
      <article className="relative size-full overflow-hidden rounded-lg p-4">
        <LayoutBadge item={item} layouts={layouts} />
        <p className="whitespace-pre-line break-words text-sm leading-6">{item.content.content}</p>
      </article>
    );
  }

  if (item.type === "playlist") {
    return (
      <article className="relative size-full overflow-hidden rounded-lg">
        <LayoutBadge item={item} layouts={layouts} />
        <PlaylistIframe content={item.content.content} title={item.content.title} />
      </article>
    );
  }

  return (
    <section className="relative flex size-full items-center rounded-lg bg-muted px-4">
      <LayoutBadge item={item} layouts={layouts} />
      <h2 className="font-semibold text-lg tracking-tight">{item.content.title}</h2>
    </section>
  );
}

export function ProfileBentoGridPlayground({ initialBento }: ProfileBentoGridPlaygroundProps) {
  const { width, containerRef, mounted } = useContainerWidth({
    initialWidth: 864,
    measureBeforeMount: true,
  });
  const [bento, setBento] = useState(initialBento);
  const [layouts, setLayouts] = useState<GridLayouts>(() => toGridLayouts(initialBento));
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
  const bentoById = useMemo(() => new Map(bento.map((item) => [item.id, item] as const)), [bento]);
  const gridItems = useMemo(() => bento.map(toGridItem), [bento]);
  const bentoCountLabel = useMemo(() => `${bento.length} items`, [bento.length]);
  const gridClassName = `w-full max-w-full [&_.react-draggable-dragging]:z-20! [&_.react-grid-item:not(.react-grid-placeholder)]:z-10 [&_.react-grid-item]:duration-[600ms]! [&_.react-grid-item]:ease-out! [&_.react-resizable-handle]:hidden! [&_.react-resizable-handle]:pointer-events-none! [&_.react-grid-placeholder]:z-0! [&_.react-grid-placeholder]:rounded-xl! [&_.react-grid-placeholder]:bg-secondary! [&_.react-grid-placeholder]:opacity-100! [&_.react-grid-placeholder]:shadow-[inset_0_1px_6px_rgb(0_0_0_/_0.08),inset_0_-1px_1px_rgb(255_255_255_/_0.8)]! ${isThinPlaceholderActive ? "[&_.react-grid-placeholder]:h-[var(--thin-placeholder-height)]! [&_.react-grid-placeholder]:translate-y-[var(--thin-placeholder-offset)]!" : ""}`;
  const gridStyle = {
    "--thin-placeholder-height": `${ROW_HEIGHT[activeBreakpoint]}px`,
    "--thin-placeholder-offset": `${ROW_HEIGHT[activeBreakpoint] + GRID_MARGIN[1]}px`,
    "--thin-item-visible-height": `${ROW_HEIGHT[activeBreakpoint]}px`,
  } as CSSProperties;

  const addItem = (type: CreatableBentoType) => {
    const liveBento = mergeLayoutsIntoBento(bento, layouts);
    const nextItem = createAutoBentoItem(type, liveBento);
    const nextBento = [...liveBento, nextItem];

    setBento(nextBento);
    setLayouts(toGridLayouts(nextBento));
  };

  const removeItem = (id: string) => {
    setBento((currentItems) => currentItems.filter((item) => item.id !== id));
    setLayouts((currentLayouts) => ({
      desktop: (currentLayouts.desktop ?? []).filter((item) => item.i !== id),
      compact: (currentLayouts.compact ?? []).filter((item) => item.i !== id),
    }));
  };

  const resizeItem = (id: string, option: ResizeOption) => {
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
  };

  return (
    <section className="flex min-w-0 flex-1 flex-col gap-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold text-2xl tracking-tight">Grid</h2>
          <p className="mt-1 text-muted-foreground text-sm">{bentoCountLabel}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {creatableTypes.map((type) => (
            <Button key={type} onClick={() => addItem(type)} type="button" variant="outline">
              Add {typeLabels[type]}
            </Button>
          ))}
        </div>
      </header>

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
            setLayouts(normalizeLayouts(nextLayouts));
          }}
          onRemoveItem={removeItem}
          onResizeItem={resizeItem}
          onResizeStart={startResize}
          onResizeStop={stopResize}
          renderItem={(gridItem) => {
            const item = bentoById.get(gridItem.id);

            return item ? <ProfileBentoCard item={item} layouts={layouts} /> : null;
          }}
          width={width}
        />
      </div>
    </section>
  );
}
