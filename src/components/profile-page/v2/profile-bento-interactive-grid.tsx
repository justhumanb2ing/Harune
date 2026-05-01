"use client";

import { motion } from "motion/react";
import type { CSSProperties } from "react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { useContainerWidth } from "react-grid-layout";
import { toast } from "sonner";
import type { GridCardMotionPhase } from "@/components/grid/grid-card";
import { ResponsiveGridCanvas } from "@/components/grid/responsive-grid-canvas";
import { ProfileBentoGridActions } from "@/components/profile-page/v2/profile-bento-grid-actions";
import { ProfileBentoEditableContentCard } from "@/components/profile-page/v2/profile-bento-grid-card";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { useGridDragMotion } from "@/hooks/use-grid-drag-motion";
import { useProfilePageEditor } from "@/hooks/use-profile-page-editor";
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

type CrawlMode = "auto" | "static" | "dynamic";

type OgData = {
  description: string | null;
  favicon: string | null;
  image: string | null;
  site_name: string | null;
  title: string | null;
  url: string | null;
};

type ErrorBody = {
  code?: string;
  details?: Record<string, unknown>;
  message: string;
  status: number;
};

type CrawlApiResponse =
  | {
      ok: true;
      data: OgData;
      meta?: {
        durationMs: number;
        fallback: boolean;
        mode: CrawlMode;
      };
    }
  | {
      ok: false;
      error: ErrorBody;
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

const EXIT_MOTION_REMOVE_DELAY_MS = 190;
const TOOLBAR_EXPAND_EASE = [0.4, 0, 0.2, 1] as const;
const TOOLBAR_EXPAND_TRANSITION = { duration: 0.36, ease: TOOLBAR_EXPAND_EASE } as const;
const LINK_INPUT_COLLAPSE_TRANSITION = {
  gridTemplateRows: { duration: 0.44, ease: TOOLBAR_EXPAND_EASE },
} as const;

function createLinkBentoSkeleton(
  rawUrl: string,
  currentBento: ProfileBentoItem[]
): Extract<ProfileBentoItem, { type: "link" }> {
  const nextItem = createAutoBentoItem("link", currentBento);

  if (nextItem.type !== "link") {
    throw new Error("Expected link bento item.");
  }

  return {
    ...nextItem,
    content: {
      title: "",
      description: "",
      favicon: "",
      thumbnail: "",
      url: rawUrl,
    },
  };
}

function createLinkBentoFromCrawl(
  item: Extract<ProfileBentoItem, { type: "link" }>,
  rawUrl: string,
  data: OgData
): Extract<ProfileBentoItem, { type: "link" }> {
  const resolvedUrl = data.url?.trim() || rawUrl;
  let fallbackTitle = resolvedUrl;

  try {
    fallbackTitle = new URL(resolvedUrl).hostname.replace(/^www\./, "");
  } catch {
    fallbackTitle = resolvedUrl;
  }

  return {
    ...item,
    content: {
      title: data.title?.trim() || fallbackTitle,
      description: data.description?.trim() || "",
      favicon: data.favicon?.trim() || "",
      thumbnail: data.image?.trim() || "",
      url: resolvedUrl,
    },
  };
}

export function ProfileBentoInteractiveGrid({ initialBento }: ProfileBentoInteractiveGridProps) {
  const profileEditor = useProfilePageEditor();
  const { width, containerRef, mounted } = useContainerWidth({
    initialWidth: 864,
    measureBeforeMount: true,
  });
  const [bento, setBento] = useState(initialBento);
  const [layouts, setLayouts] = useState<GridLayouts>(() => toBentoGridLayouts(initialBento));
  const [savedSnapshot, setSavedSnapshot] = useState(() =>
    createPayloadSnapshot(initialBento, toBentoGridLayouts(initialBento))
  );
  const [itemMotionPhaseById, setItemMotionPhaseById] = useState<
    Record<string, GridCardMotionPhase>
  >({});
  const [focusItemId, setFocusItemId] = useState<string | null>(null);
  const [isLinkInputOpen, setIsLinkInputOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [loadingLinkItemIds, setLoadingLinkItemIds] = useState<ReadonlySet<string>>(
    () => new Set()
  );
  const [actionRowWidth, setActionRowWidth] = useState<number | null>(null);
  const actionRowRef = useRef<HTMLDivElement>(null);
  const linkInputRef = useRef<HTMLInputElement>(null);
  const toolbarRef = useRef<HTMLElement>(null);
  const removeTimerByIdRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
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
  const hasProfileChanges = profileEditor.hasUnsyncedChanges;
  const isCrawlingLink = loadingLinkItemIds.size > 0;
  const isSaving = isPending || profileEditor.isSyncing;
  const canSave = isDirty || hasProfileChanges;
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

  useEffect(() => {
    const removeTimerById = removeTimerByIdRef.current;

    return () => {
      for (const timer of Object.values(removeTimerById)) {
        clearTimeout(timer);
      }
    };
  }, []);

  useLayoutEffect(() => {
    const actionRow = actionRowRef.current;

    if (!actionRow) {
      return;
    }

    const updateActionRowWidth = () => {
      setActionRowWidth(Math.ceil(actionRow.getBoundingClientRect().width));
    };

    updateActionRowWidth();

    const observer = new ResizeObserver(updateActionRowWidth);
    observer.observe(actionRow);

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!isLinkInputOpen) {
      return;
    }

    const frame = requestAnimationFrame(() => {
      linkInputRef.current?.focus();
    });

    return () => {
      cancelAnimationFrame(frame);
    };
  }, [isLinkInputOpen]);

  useEffect(() => {
    if (!isLinkInputOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const toolbar = toolbarRef.current;
      const target = event.target;

      if (!toolbar || !(target instanceof Node) || toolbar.contains(target)) {
        return;
      }

      setIsLinkInputOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [isLinkInputOpen]);

  const addItem = (type: CreatableBentoType) => {
    const liveBento = mergeLayoutsIntoBento(bento, layouts);
    const nextItem = createAutoBentoItem(type, liveBento);
    const nextBento = [...liveBento, nextItem];

    setItemMotionPhaseById((current) => ({ ...current, [nextItem.id]: "entering" }));
    setFocusItemId(type === "text" || type === "section" ? nextItem.id : null);
    setBento(nextBento);
    setLayouts(toBentoGridLayouts(nextBento));
  };

  const removeItemFromGrid = useCallback((id: string) => {
    setBento((currentItems) => currentItems.filter((item) => item.id !== id));
    setLayouts((currentLayouts) => ({
      desktop: (currentLayouts.desktop ?? []).filter((item) => item.i !== id),
      compact: (currentLayouts.compact ?? []).filter((item) => item.i !== id),
    }));
  }, []);

  const removeLoadingLinkId = useCallback((id: string) => {
    setLoadingLinkItemIds((current) => {
      if (!current.has(id)) {
        return current;
      }

      const next = new Set(current);
      next.delete(id);
      return next;
    });
  }, []);

  const removeItem = (id: string) => {
    if (removeTimerByIdRef.current[id]) {
      return;
    }

    removeLoadingLinkId(id);

    if (focusItemId === id) {
      setFocusItemId(null);
    }

    setItemMotionPhaseById((current) =>
      current[id] === "exiting" ? current : { ...current, [id]: "exiting" }
    );
    removeTimerByIdRef.current[id] = setTimeout(() => {
      delete removeTimerByIdRef.current[id];
      removeItemFromGrid(id);
      setItemMotionPhaseById((current) => {
        if (!current[id]) {
          return current;
        }

        const next = { ...current };
        delete next[id];
        return next;
      });
    }, EXIT_MOTION_REMOVE_DELAY_MS);
  };

  const completeItemMotion = useCallback(
    (id: string, phase: GridCardMotionPhase) => {
      if (phase === "exiting" && removeTimerByIdRef.current[id]) {
        clearTimeout(removeTimerByIdRef.current[id]);
        delete removeTimerByIdRef.current[id];
      }

      setItemMotionPhaseById((current) => {
        if (current[id] !== phase) {
          return current;
        }

        const next = { ...current };
        delete next[id];
        return next;
      });

      if (phase === "exiting") {
        removeItemFromGrid(id);
      }
    },
    [removeItemFromGrid]
  );

  const getItemMotionPhase = useCallback(
    (id: string) => itemMotionPhaseById[id],
    [itemMotionPhaseById]
  );

  const updateItem = (nextItem: ProfileBentoItem) => {
    setBento((currentItems) =>
      currentItems.map((item) => (item.id === nextItem.id ? nextItem : item))
    );
  };

  const handleLinkCrawl = async () => {
    const rawUrl = linkUrl.trim();

    if (!rawUrl) {
      toast.error("Please enter a URL");
      return;
    }

    try {
      new URL(rawUrl);
    } catch {
      toast.error("Please enter a valid URL");
      return;
    }

    const liveBento = mergeLayoutsIntoBento(bento, layouts);
    const placeholderItem = createLinkBentoSkeleton(rawUrl, liveBento);
    const nextBento = [...liveBento, placeholderItem];

    setLoadingLinkItemIds((current) => new Set(current).add(placeholderItem.id));
    setItemMotionPhaseById((current) => ({ ...current, [placeholderItem.id]: "entering" }));
    setFocusItemId(null);
    setBento(nextBento);
    setLayouts(toBentoGridLayouts(nextBento));
    setLinkUrl("");

    try {
      const searchParams = new URLSearchParams({
        url: rawUrl,
        mode: "auto",
      });
      const response = await fetch(`https://api.bybu.cc/api/crawl?${searchParams.toString()}`);
      const body = (await response.json()) as CrawlApiResponse;

      if (!response.ok || !body.ok) {
        throw new Error(body.ok ? "Could not fetch link details" : body.error.message);
      }

      const nextItem = createLinkBentoFromCrawl(placeholderItem, rawUrl, body.data);

      setBento((currentItems) =>
        currentItems.map((item) => (item.id === placeholderItem.id ? nextItem : item))
      );
      removeLoadingLinkId(placeholderItem.id);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message.replace(/\./g, "") : "Could not fetch link details"
      );
      removeLoadingLinkId(placeholderItem.id);
      removeItemFromGrid(placeholderItem.id);
      setItemMotionPhaseById((current) => {
        if (!current[placeholderItem.id]) {
          return current;
        }

        const next = { ...current };
        delete next[placeholderItem.id];
        return next;
      });
    }
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
    if (!canSave || isSaving || isCrawlingLink) {
      return;
    }

    startTransition(async () => {
      try {
        if (hasProfileChanges) {
          await profileEditor.handleSync();
        }

        if (isDirty) {
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
          toast("Synced");
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to sync bento", {
          description: getApiErrorDescription(error),
        });
      }
    });
  };

  return (
    <section className="relative flex min-w-0 flex-1 flex-col items-center gap-4 pb-28 xl:w-[56rem] xl:flex-none xl:items-stretch">
      <motion.header
        className="fixed bottom-6 left-1/2 z-30 flex w-auto -translate-x-1/2 flex-col items-center justify-center rounded-xl border bg-background/90 p-2 shadow-xs backdrop-blur"
        layout
        ref={toolbarRef}
        transition={TOOLBAR_EXPAND_TRANSITION}
      >
        <div className="overflow-hidden">
          <motion.form
            animate={{
              gridTemplateRows: isLinkInputOpen ? "1fr" : "0fr",
            }}
            aria-hidden={!isLinkInputOpen}
            className={`grid w-full overflow-hidden ${isLinkInputOpen ? "" : "pointer-events-none"}`}
            initial={false}
            onSubmit={(event) => {
              event.preventDefault();

              if (!isLinkInputOpen) {
                return;
              }

              void handleLinkCrawl();
            }}
            style={actionRowWidth ? { width: actionRowWidth } : undefined}
            transition={LINK_INPUT_COLLAPSE_TRANSITION}
          >
            <div className="min-h-0 overflow-hidden">
              <div className="pb-2">
                <Field className="relative rounded-lg bg-background py-1 outline-none">
                  <InputGroup className="border-0 bg-background! ring-0 has-[[data-slot=input-group-control]:focus-visible]:border-transparent has-[[data-slot=input-group-control]:focus-visible]:ring-0">
                    <InputGroupInput
                      aria-label="Link URL"
                      className="text-sm!"
                      disabled={!isLinkInputOpen || isCrawlingLink}
                      id="profile-bento-link-url"
                      onChange={(event) => setLinkUrl(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key !== "Enter" || !isLinkInputOpen) {
                          return;
                        }

                        event.preventDefault();
                        void handleLinkCrawl();
                      }}
                      placeholder="https://example.com"
                      ref={linkInputRef}
                      value={linkUrl}
                    />
                    <InputGroupAddon align="inline-end">
                      <InputGroupButton
                        aria-label="Fetch link details"
                        className="h-8 border-border/60 bg-background px-3 font-semibold text-base text-black shadow-sm"
                        disabled={!isLinkInputOpen || isCrawlingLink || !linkUrl.trim()}
                        type="submit"
                        variant="outline"
                      >
                        {isCrawlingLink ? <span>Getting...</span> : <span>Get</span>}
                      </InputGroupButton>
                    </InputGroupAddon>
                  </InputGroup>
                </Field>
              </div>
            </div>
          </motion.form>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2" ref={actionRowRef}>
          <ProfileBentoGridActions
            onAddItem={addItem}
            onRequestLinkInput={() => setIsLinkInputOpen(true)}
          />
          <Button
            aria-busy={isSaving}
            disabled={!canSave || isSaving || isCrawlingLink}
            onClick={save}
            type="button"
          >
            {isSaving ? "Saving" : "Save"}
          </Button>
        </div>
      </motion.header>

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
          onItemMotionComplete={completeItemMotion}
          onLayoutChange={(nextLayouts) => {
            setLayouts(normalizeLayouts(nextLayouts, itemTypeById));
          }}
          onRemoveItem={removeItem}
          onResizeItem={resizeItem}
          onResizeStart={startResize}
          onResizeStop={stopResize}
          getItemMotionPhase={getItemMotionPhase}
          renderItem={(gridItem) => {
            const item = bentoById.get(gridItem.id);

            return item ? (
              <ProfileBentoEditableContentCard
                autoFocus={focusItemId === item.id}
                isLoading={loadingLinkItemIds.has(item.id)}
                item={item}
                onChange={updateItem}
                onFocusReady={() => {
                  setFocusItemId((current) => (current === item.id ? null : current));
                }}
              />
            ) : null;
          }}
          rowHeight={rowHeight}
          width={width}
        />
      </div>
    </section>
  );
}
