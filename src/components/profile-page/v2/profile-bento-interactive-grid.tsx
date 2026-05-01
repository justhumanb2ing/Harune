"use client";

import type { CSSProperties } from "react";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useContainerWidth } from "react-grid-layout";
import { toast } from "sonner";
import { ResponsiveGridCanvas } from "@/components/grid/responsive-grid-canvas";
import { ProfileBentoGridActions } from "@/components/profile-page/v2/profile-bento-grid-actions";
import { ProfileBentoEditableContentCard } from "@/components/profile-page/v2/profile-bento-grid-card";
import { Button } from "@/components/ui/button";
import { useGridDragMotion } from "@/hooks/use-grid-drag-motion";
import { BREAKPOINTS, COLS, GRID_MARGIN, getGridRowHeight } from "@/lib/grid/grid-config";
import { normalizeLayouts } from "@/lib/grid/grid-layout-utils";
import type { GridBreakpoint, GridLayouts, ResizeOption } from "@/lib/grid/grid-types";
import type { ProfileBentoItem, PublicProfileBentoPageData } from "@/lib/profile-page/types";
import { apiFetch, getApiErrorDescription } from "@/lib/react-query/fetcher";
import {
  type CreatableBentoType,
  createAutoBentoItem,
  mergeLayoutsIntoBento,
  toBentoGridItem,
  toBentoGridLayouts,
  toBentoItemTypeById,
} from "./profile-bento-grid-model";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

type ProfileBentoInteractiveGridProps = {
  initialBento: ProfileBentoItem[];
};

const createPayload = (items: ProfileBentoItem[], layouts: GridLayouts) => ({
  bento: mergeLayoutsIntoBento(items, layouts).map((item) => {
    if (item.type !== "link") {
      return item;
    }

    return {
      ...item,
      content: {
        ...item.content,
        description: item.content.description ?? "",
        favicon: item.content.favicon ?? "",
        thumbnail: item.content.thumbnail ?? "",
      },
    };
  }),
});

const createPayloadSnapshot = (items: ProfileBentoItem[], layouts: GridLayouts) =>
  JSON.stringify(createPayload(items, layouts));

export function ProfileBentoInteractiveGrid({ initialBento }: ProfileBentoInteractiveGridProps) {
  const { width, containerRef, mounted } = useContainerWidth({
    initialWidth: 864,
    measureBeforeMount: true,
  });
  const [bento, setBento] = useState(initialBento);
  const [layouts, setLayouts] = useState<GridLayouts>(() => toBentoGridLayouts(initialBento));
  const [savedSnapshot, setSavedSnapshot] = useState(() =>
    createPayloadSnapshot(initialBento, toBentoGridLayouts(initialBento))
  );
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
  const bentoById = useMemo(() => new Map(bento.map((item) => [item.id, item] as const)), [bento]);
  const itemTypeById = useMemo(() => toBentoItemTypeById(bento), [bento]);
  const gridItems = useMemo(() => bento.map(toBentoGridItem), [bento]);
  const currentPayload = useMemo(() => createPayload(bento, layouts), [bento, layouts]);
  const currentSnapshot = useMemo(() => JSON.stringify(currentPayload), [currentPayload]);
  const isDirty = currentSnapshot !== savedSnapshot;
  const isSectionDragActive =
    activeDragItemId !== null && itemTypeById.get(activeDragItemId) === "section";
  const rowHeight = getGridRowHeight(width, activeBreakpoint);
  const thinItemVisibleHeight = Math.round(rowHeight * 0.75);
  const gridClassName = `w-[380px] max-w-full xl:w-full [&_.react-draggable-dragging]:z-20! [&_.react-grid-item:not(.react-grid-placeholder)]:z-10 [&_.react-grid-item]:duration-[600ms]! [&_.react-grid-item]:ease-out! [&_.react-resizable-handle]:hidden! [&_.react-resizable-handle]:pointer-events-none! [&_.react-grid-placeholder]:z-0! [&_.react-grid-placeholder]:rounded-xl! [&_.react-grid-placeholder]:bg-secondary! [&_.react-grid-placeholder]:opacity-100! [&_.react-grid-placeholder]:shadow-[inset_0_1px_6px_rgb(0_0_0_/_0.08),inset_0_-1px_1px_rgb(255_255_255_/_0.8)]! ${isThinPlaceholderActive || isSectionDragActive ? "[&_.react-grid-placeholder]:h-[var(--thin-placeholder-height)]! [&_.react-grid-placeholder]:translate-y-[var(--thin-placeholder-offset)]!" : ""}`;
  const gridStyle = {
    "--thin-placeholder-height": `${thinItemVisibleHeight}px`,
    "--thin-placeholder-offset": `${rowHeight * 2 + GRID_MARGIN[1] - thinItemVisibleHeight}px`,
    "--thin-item-visible-height": `${thinItemVisibleHeight}px`,
  } as CSSProperties;

  useEffect(() => {
    if (!isDirty) {
      return;
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isDirty]);

  const addItem = (type: CreatableBentoType) => {
    const liveBento = mergeLayoutsIntoBento(bento, layouts);
    const nextItem = createAutoBentoItem(type, liveBento);
    const nextBento = [...liveBento, nextItem];

    setBento(nextBento);
    setLayouts(toBentoGridLayouts(nextBento));
  };

  const removeItem = (id: string) => {
    setBento((currentItems) => currentItems.filter((item) => item.id !== id));
    setLayouts((currentLayouts) => ({
      desktop: (currentLayouts.desktop ?? []).filter((item) => item.i !== id),
      compact: (currentLayouts.compact ?? []).filter((item) => item.i !== id),
    }));
  };

  const updateItem = (nextItem: ProfileBentoItem) => {
    setBento((currentItems) =>
      currentItems.map((item) => (item.id === nextItem.id ? nextItem : item))
    );
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
    if (!isDirty || isPending) {
      return;
    }

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
            body: JSON.stringify(currentPayload),
          }
        );
        const nextLayouts = toBentoGridLayouts(response.bento);

        setBento(response.bento);
        setLayouts(nextLayouts);
        setSavedSnapshot(createPayloadSnapshot(response.bento, nextLayouts));
        toast("Bento synced");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to sync bento", {
          description: getApiErrorDescription(error),
        });
      }
    });
  };

  return (
    <section className="relative flex min-w-0 flex-1 flex-col items-center gap-4 xl:min-h-[calc(100lvh-4rem)] xl:w-[56rem] xl:flex-none xl:items-stretch">
      <header className="sticky top-4 z-30 flex w-[380px] max-w-full flex-wrap items-center justify-between gap-3 rounded-xl border bg-background/90 p-2 shadow-xs backdrop-blur xl:w-full">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span className="rounded-full bg-foreground px-2 py-1 font-medium text-[10px] text-background uppercase tracking-normal">
            Editing
          </span>
          {isDirty ? (
            <span className="rounded-full bg-yellow-100 px-2 py-1 font-medium text-[10px] text-yellow-900 uppercase tracking-normal">
              Unsaved
            </span>
          ) : (
            <span className="rounded-full bg-muted px-2 py-1 font-medium text-[10px] text-muted-foreground uppercase tracking-normal">
              Saved
            </span>
          )}
          <ProfileBentoGridActions onAddItem={addItem} />
        </div>
        <Button disabled={!isDirty || isPending} onClick={save} type="button">
          {isPending ? "Saving" : isDirty ? "Save" : "Saved"}
        </Button>
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
            setLayouts(normalizeLayouts(nextLayouts, itemTypeById));
          }}
          onRemoveItem={removeItem}
          onResizeItem={resizeItem}
          onResizeStart={startResize}
          onResizeStop={stopResize}
          renderItem={(gridItem) => {
            const item = bentoById.get(gridItem.id);

            return item ? (
              <ProfileBentoEditableContentCard item={item} onChange={updateItem} />
            ) : null;
          }}
          rowHeight={rowHeight}
          width={width}
        />
      </div>
    </section>
  );
}
