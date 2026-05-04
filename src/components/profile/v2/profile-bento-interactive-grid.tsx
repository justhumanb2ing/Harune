"use client";

import { LinkBreakIcon, LinkSimpleIcon } from "@phosphor-icons/react";
import { ExpandIcon } from "lucide-react";
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
import { ProfileBentoGridActions } from "@/components/profile/v2/profile-bento-grid-actions";
import {
  getProfileBentoLinkSize,
  ProfileBentoEditableContentCard,
} from "@/components/profile/v2/profile-bento-grid-card";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { useGridDragMotion } from "@/hooks/use-grid-drag-motion";
import { useProfilePageEditor } from "@/hooks/use-profile-editor";
import { rootApiClient } from "@/lib/api/client";
import { BREAKPOINTS, COLS, GRID_MARGIN, getGridRowHeight } from "@/lib/grid/grid-config";
import { normalizeLayouts } from "@/lib/grid/grid-layout-utils";
import type { GridBreakpoint, GridLayouts, ResizeOption } from "@/lib/grid/grid-types";
import {
  getProfileBentoMediaFileError,
  getProfileBentoMediaType,
  PROFILE_BENTO_MEDIA_ACCEPT,
  PROFILE_BENTO_MEDIA_MAX_SIZE_BYTES,
  PROFILE_BENTO_MEDIA_UPLOAD_ROUTE,
} from "@/lib/profile/media-upload";
import type { ProfileBentoItem, PublicProfileBentoPageData } from "@/lib/profile/types";
import { apiFetch } from "@/lib/react-query/fetcher";
import { cn } from "@/lib/utils";
import { ProfileBentoGridMotion } from "./profile-bento-entry-motion";
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

type CrawlMetadataResponse = {
  description: string | null;
  favicon: string | null;
  image: string | null;
  readMode: "head" | "document";
  sitename: string | null;
  title: string | null;
  url: string;
};

type ErrorBody = {
  error: string;
};

type MediaUploadResponse = {
  contentHash: string;
  contentType: string;
  mediaType: "image" | "video";
  tempObjectKey: string;
  tempUrl: string;
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
        description: "",
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
  data: CrawlMetadataResponse
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

function createMediaBentoFromFile(
  file: File,
  previewUrl: string,
  currentBento: ProfileBentoItem[]
): Extract<ProfileBentoItem, { type: "media" }> {
  const nextItem = createAutoBentoItem("media", currentBento);

  if (nextItem.type !== "media") {
    throw new Error("Expected media bento item.");
  }

  const mediaType = getProfileBentoMediaType(file.type);

  if (!mediaType) {
    throw new Error("Unsupported media type.");
  }

  const fileName = file.name.replace(/\.[^.]+$/, "").trim();

  return {
    ...nextItem,
    content: {
      mediaType,
      url: previewUrl,
      objectKey: "",
      href: null,
      alt: fileName,
      caption: "",
    },
  };
}

function MediaLinkControl({
  item,
  onChange,
}: {
  item: Extract<ProfileBentoItem, { type: "media" }>;
  onChange: (item: ProfileBentoItem) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = `media-link-${item.id}`;
  const href = item.content.href ?? "";
  const Icon = href ? LinkSimpleIcon : LinkBreakIcon;

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const frame = requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.setSelectionRange(href.length, href.length);
    });

    return () => {
      cancelAnimationFrame(frame);
    };
  }, [href.length, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;

      if (
        !containerRef.current ||
        !(target instanceof Node) ||
        containerRef.current.contains(target)
      ) {
        return;
      }

      setIsOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={containerRef}>
      <button
        aria-controls={isOpen ? inputId : undefined}
        aria-expanded={isOpen}
        aria-label={href ? "Edit media link" : "Add media link"}
        className={cn(
          "flex size-8 items-center justify-center rounded-md transition-colors hover:bg-primary-foreground hover:text-primary",
          href ? "bg-primary-foreground text-primary" : "text-primary-foreground"
        )}
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        <Icon aria-hidden className="size-5" weight="bold" />
      </button>
      {isOpen ? (
        <div className="absolute right-0 bottom-full z-50 mb-2 w-64 rounded-xl border border-white/10 bg-foreground/95 p-1 shadow-float backdrop-blur-sm">
          <Input
            aria-label="Media link URL"
            className="h-9 border-0 bg-black/25 text-primary-foreground placeholder:text-primary-foreground/45 hover:border-white/10 focus-visible:border-white/10 focus-visible:ring-0"
            id={inputId}
            onChange={(event) => {
              const nextHref = event.target.value;

              onChange({
                ...item,
                content: {
                  ...item.content,
                  href: nextHref.trim().length > 0 ? nextHref : null,
                },
              });
            }}
            placeholder="https://example.com"
            ref={inputRef}
            value={href}
          />
        </div>
      ) : null}
    </div>
  );
}

async function prepareMediaFile(file: File) {
  if (!file.type.startsWith("image/") || file.type === "image/gif") {
    return file;
  }

  const { default: imageCompression } = await import("browser-image-compression");

  return imageCompression(file, {
    fileType: file.type,
    initialQuality: 0.86,
    maxSizeMB: PROFILE_BENTO_MEDIA_MAX_SIZE_BYTES / 1024 / 1024,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
  });
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
  const [activeMapInteractionItemId, setActiveMapInteractionItemId] = useState<string | null>(null);
  const [linkUrl, setLinkUrl] = useState("");
  const [loadingLinkItemIds, setLoadingLinkItemIds] = useState<ReadonlySet<string>>(
    () => new Set()
  );
  const [uploadingMediaItemIds, setUploadingMediaItemIds] = useState<ReadonlySet<string>>(
    () => new Set()
  );
  const [actionRowWidth, setActionRowWidth] = useState<number | null>(null);
  const actionRowRef = useRef<HTMLDivElement>(null);
  const linkInputRef = useRef<HTMLInputElement>(null);
  const mediaInputRef = useRef<HTMLInputElement>(null);
  const toolbarRef = useRef<HTMLElement>(null);
  const mediaObjectUrlsByIdRef = useRef<Record<string, string>>({});
  const removeTimerByIdRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const [pendingScrollItemId, setPendingScrollItemId] = useState<string | null>(null);
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
  const isUploadingMedia = uploadingMediaItemIds.size > 0;
  const isSaving = isPending || profileEditor.isSyncing;
  const canSave = isDirty || hasProfileChanges;
  const isSectionDragActive =
    activeDragItemId !== null && itemTypeById.get(activeDragItemId) === "section";
  const isThinPlaceholderShapeActive = isThinPlaceholderActive || isSectionDragActive;
  const rowHeight = getGridRowHeight(width, activeBreakpoint);
  const thinItemVisibleHeight = Math.round(rowHeight * 0.75);
  const gridClassName = `w-[380px] max-w-full sm:w-[425px] xl:w-full [&_.react-draggable-dragging]:z-20! [&_.react-grid-item:not(.react-grid-placeholder)]:z-10 [&_.react-grid-item:focus-within]:z-30! [&_.react-grid-item]:duration-[600ms]! [&_.react-grid-item]:ease-out! [&_.react-resizable-handle]:hidden! [&_.react-resizable-handle]:pointer-events-none! [&_.react-grid-placeholder]:z-0! [&_.react-grid-placeholder]:bg-secondary! [&_.react-grid-placeholder]:opacity-100! [&_.react-grid-placeholder]:shadow-[inset_0_1px_6px_rgb(0_0_0_/_0.08),inset_0_-1px_1px_rgb(255_255_255_/_0.8)]! ${isThinPlaceholderShapeActive ? "[&_.react-grid-placeholder]:h-[var(--thin-placeholder-height)]! [&_.react-grid-placeholder]:translate-y-[var(--thin-placeholder-offset)]! [&_.react-grid-placeholder]:rounded-lg!" : "[&_.react-grid-placeholder]:rounded-[1.5rem]!"}`;
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

      for (const objectUrl of Object.values(mediaObjectUrlsByIdRef.current)) {
        URL.revokeObjectURL(objectUrl);
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

  const scrollToGridItem = useCallback(
    (id: string) => {
      const grid = containerRef.current;
      const item = grid?.querySelector<HTMLElement>(
        `[data-profile-bento-grid-item-id="${CSS.escape(id)}"]`
      );

      if (!item) {
        return false;
      }

      item.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "nearest",
      });
      return true;
    },
    [containerRef]
  );

  useEffect(() => {
    if (!pendingScrollItemId) {
      return;
    }

    let attempt = 0;
    let frame = 0;

    const scroll = () => {
      attempt += 1;

      if (scrollToGridItem(pendingScrollItemId) || attempt >= 4) {
        setPendingScrollItemId((current) => (current === pendingScrollItemId ? null : current));
        return;
      }

      frame = requestAnimationFrame(scroll);
    };

    frame = requestAnimationFrame(scroll);

    return () => {
      cancelAnimationFrame(frame);
    };
  }, [pendingScrollItemId, scrollToGridItem]);

  const addItem = (type: CreatableBentoType) => {
    const liveBento = mergeLayoutsIntoBento(bento, layouts);
    const nextItem = createAutoBentoItem(type, liveBento);
    const nextBento = [...liveBento, nextItem];

    setPendingScrollItemId(nextItem.id);
    setItemMotionPhaseById((current) => ({ ...current, [nextItem.id]: "entering" }));
    setFocusItemId(type === "text" || type === "section" ? nextItem.id : null);
    setBento(nextBento);
    setLayouts(toBentoGridLayouts(nextBento));
  };

  const removeItemFromGrid = useCallback((id: string) => {
    const objectUrl = mediaObjectUrlsByIdRef.current[id];

    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
      delete mediaObjectUrlsByIdRef.current[id];
    }

    setBento((currentItems) => currentItems.filter((item) => item.id !== id));
    setActiveMapInteractionItemId((current) => (current === id ? null : current));
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
    setUploadingMediaItemIds((current) => {
      if (!current.has(id)) {
        return current;
      }

      const next = new Set(current);
      next.delete(id);
      return next;
    });

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

  const updateItem = useCallback((nextItem: ProfileBentoItem) => {
    setBento((currentItems) =>
      currentItems.map((item) => (item.id === nextItem.id ? nextItem : item))
    );
  }, []);

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

    setPendingScrollItemId(placeholderItem.id);
    setLoadingLinkItemIds((current) => new Set(current).add(placeholderItem.id));
    setItemMotionPhaseById((current) => ({ ...current, [placeholderItem.id]: "entering" }));
    setFocusItemId(null);
    setBento(nextBento);
    setLayouts(toBentoGridLayouts(nextBento));
    setLinkUrl("");

    try {
      const response = await rootApiClient.api.crawl.$get({ query: { url: rawUrl } });
      const body = (await response.json()) as CrawlMetadataResponse | ErrorBody;

      if (!response.ok) {
        throw new Error("error" in body ? body.error : "Could not fetch link details");
      }

      if ("error" in body) {
        throw new Error(body.error);
      }

      const nextItem = createLinkBentoFromCrawl(placeholderItem, rawUrl, body);

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

  const handleMediaFile = async (file: File) => {
    const initialError = getProfileBentoMediaFileError(file);

    if (initialError) {
      toast.error(initialError);
      return;
    }

    let uploadFile: File;

    try {
      uploadFile = await prepareMediaFile(file);
    } catch {
      toast.error("이미지 압축에 실패했어요.");
      return;
    }

    const preparedError = getProfileBentoMediaFileError(uploadFile);

    if (preparedError) {
      toast.error(preparedError);
      return;
    }

    const previewUrl = URL.createObjectURL(uploadFile);
    const liveBento = mergeLayoutsIntoBento(bento, layouts);
    const placeholderItem = createMediaBentoFromFile(uploadFile, previewUrl, liveBento);
    const nextBento = [...liveBento, placeholderItem];

    setPendingScrollItemId(placeholderItem.id);
    mediaObjectUrlsByIdRef.current[placeholderItem.id] = previewUrl;
    setUploadingMediaItemIds((current) => new Set(current).add(placeholderItem.id));
    setItemMotionPhaseById((current) => ({ ...current, [placeholderItem.id]: "entering" }));
    setFocusItemId(null);
    setBento(nextBento);
    setLayouts(toBentoGridLayouts(nextBento));

    try {
      const formData = new FormData();
      formData.set("file", uploadFile);
      formData.set("bentoId", placeholderItem.id);

      const response = await apiFetch<MediaUploadResponse>(PROFILE_BENTO_MEDIA_UPLOAD_ROUTE, {
        method: "POST",
        cache: "no-store",
        headers: {
          "Cache-Control": "no-store",
        },
        body: formData,
      });

      setBento((currentItems) =>
        currentItems.map((item) => {
          if (item.id !== placeholderItem.id || item.type !== "media") {
            return item;
          }

          return {
            ...item,
            content: {
              ...item.content,
              contentHash: response.contentHash,
              contentType: response.contentType,
              mediaType: response.mediaType,
              objectKey: response.tempObjectKey,
              tempObjectKey: response.tempObjectKey,
              url: response.tempUrl,
            },
          };
        })
      );
      URL.revokeObjectURL(previewUrl);
      delete mediaObjectUrlsByIdRef.current[placeholderItem.id];
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "미디어 업로드에 실패했어요.");
      removeItemFromGrid(placeholderItem.id);
      setItemMotionPhaseById((current) => {
        if (!current[placeholderItem.id]) {
          return current;
        }

        const next = { ...current };
        delete next[placeholderItem.id];
        return next;
      });
    } finally {
      setUploadingMediaItemIds((current) => {
        if (!current.has(placeholderItem.id)) {
          return current;
        }

        const next = new Set(current);
        next.delete(placeholderItem.id);
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
    if (!canSave || isSaving || isCrawlingLink || isUploadingMedia) {
      return;
    }

    startTransition(async () => {
      try {
        if (hasProfileChanges) {
          await profileEditor.handleSync();
        }

        if (isDirty) {
          const response = await apiFetch<PublicProfileBentoPageData>("/api/profile/bento/sync", {
            method: "POST",
            cache: "no-store",
            headers: {
              "Content-Type": "application/json",
              "Cache-Control": "no-store",
            },
            body: JSON.stringify(currentPayload),
          });
          const nextLayouts = toBentoGridLayouts(response.bento);

          setBento(response.bento);
          setLayouts(nextLayouts);
          setSavedSnapshot(createPayloadSnapshot(response.bento, nextLayouts));
          toast("Synced");
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to sync bento");
      }
    });
  };

  return (
    <ProfileBentoGridMotion
      className="relative flex min-w-0 flex-1 flex-col items-center gap-4 pb-28 xl:w-[52rem] xl:flex-none xl:items-stretch 2xl:w-[56rem]"
      ready={mounted}
    >
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
            onRequestMediaInput={() => mediaInputRef.current?.click()}
            onRequestLinkInput={() => setIsLinkInputOpen(true)}
          />
          <input
            accept={PROFILE_BENTO_MEDIA_ACCEPT}
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";

              if (file) {
                void handleMediaFile(file);
              }
            }}
            ref={mediaInputRef}
            type="file"
          />
          <Button
            aria-busy={isSaving}
            disabled={!canSave || isSaving || isCrawlingLink || isUploadingMedia}
            onClick={save}
            type="button"
          >
            {isSaving ? "Saving" : isUploadingMedia ? "Uploading" : "Save"}
          </Button>
        </div>
      </motion.header>

      <div className={gridClassName} ref={containerRef} style={gridStyle}>
        {mounted ? (
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
              const activeLayout =
                layouts[activeBreakpoint]?.find((layoutItem) => layoutItem.i === gridItem.id) ??
                item?.layout[activeBreakpoint];
              const layoutSize = activeLayout
                ? getProfileBentoLinkSize(activeLayout.w, activeLayout.h)
                : undefined;

              return item ? (
                <ProfileBentoEditableContentCard
                  activeBreakpoint={activeBreakpoint}
                  autoFocus={focusItemId === item.id}
                  isLoading={loadingLinkItemIds.has(item.id)}
                  item={item}
                  layoutSize={item.type === "link" ? layoutSize : undefined}
                  mapInteractionEnabled={activeMapInteractionItemId === item.id}
                  onChange={updateItem}
                  onFocusReady={() => {
                    setFocusItemId((current) => (current === item.id ? null : current));
                  }}
                />
              ) : null;
            }}
            renderTrailingResizeControl={(gridItem) => {
              const item = bentoById.get(gridItem.id);

              return item?.type === "media" ? (
                <MediaLinkControl item={item} onChange={updateItem} />
              ) : item?.type === "map" ? (
                <Button
                  aria-label={
                    activeMapInteractionItemId === item.id
                      ? "Disable map interaction"
                      : "Enable map interaction"
                  }
                  aria-pressed={activeMapInteractionItemId === item.id}
                  className="size-8.5 min-h-8 min-w-8 rounded-md text-primary-foreground hover:bg-primary-foreground hover:text-primary aria-pressed:bg-primary-foreground aria-pressed:text-primary"
                  onClick={() => {
                    setActiveMapInteractionItemId((current) =>
                      current === item.id ? null : item.id
                    );
                  }}
                  size="icon"
                  type="button"
                  variant="ghost"
                >
                  <ExpandIcon aria-hidden className="size-5 stroke-3" />
                </Button>
              ) : null;
            }}
            rowHeight={rowHeight}
            width={width}
          />
        ) : null}
      </div>
    </ProfileBentoGridMotion>
  );
}
