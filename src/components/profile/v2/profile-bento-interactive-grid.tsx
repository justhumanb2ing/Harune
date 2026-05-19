"use client";

import { LinkBreakIcon, LinkSimpleIcon, SpinnerGapIcon } from "@phosphor-icons/react";
import { CheckIcon, ExpandIcon } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { usePathname } from "next/navigation";
import type { CSSProperties, RefObject } from "react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { type LayoutItem, useContainerWidth } from "react-grid-layout";
import { toast } from "sonner";
import type { GridCardMotionPhase } from "@/components/grid/grid-card";
import {
  backgroundColorOptions,
  getBackgroundColorOption,
} from "@/components/grid/grid-text-surface";
import { ResponsiveGridCanvas } from "@/components/grid/responsive-grid-canvas";
import type { ProfileBentoGridPreviewMode } from "@/components/profile/v2/profile-bento-grid-actions";
import { ProfileBentoGridActions } from "@/components/profile/v2/profile-bento-grid-actions";
import {
  getProfileBentoLinkSize,
  ProfileBentoEditableContentCard,
} from "@/components/profile/v2/profile-bento-grid-card";
import { normalizeLinkInputUrl } from "@/components/profile/v2/profile-link-input-utils";
import {
  Popover,
  PopoverPanel,
  PopoverTrigger,
} from "@/components/ui/animate-ui/components/base/popover";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useGridDragMotion } from "@/hooks/use-grid-drag-motion";
import { useProfilePageEditor } from "@/hooks/use-profile-editor";
import { ApiError } from "@/lib/api/error";
import { getMetadata } from "@/lib/api/generated/http/metadata-api/metadata-api";
import { uploadProfileBentoMedia } from "@/lib/api/generated/http/profile-api/profile-api";
import type { UpdateProfilePageBodyBentoItem } from "@/lib/api/generated/http/schemas/profile-api";
import { appConfig } from "@/lib/config";
import { COLS, GRID_MARGIN, getGridRowHeight } from "@/lib/grid/grid-config";
import { getGridLayoutPixelHeight, normalizeLayouts } from "@/lib/grid/grid-layout-utils";
import type { GridBreakpoint, GridLayouts, ResizeOption } from "@/lib/grid/grid-types";
import {
  isGithubContributionsProviderMetadata,
  type MetadataErrorResponse,
  type NormalizedMetadata,
} from "@/lib/metadata/url-metadata";
import { getProfileAppPath, getProfileRouteHandle } from "@/lib/profile/app-paths";
import { normalizeClockWidgetConfig } from "@/lib/profile/clock";
import {
  getProfileBentoMediaFileError,
  getProfileBentoMediaHash,
  getProfileBentoMediaType,
  PROFILE_BENTO_MEDIA_ACCEPT,
  PROFILE_BENTO_MEDIA_MAX_SIZE_BYTES,
} from "@/lib/profile/media-upload";
import type { ProfileBentoItem, ProfileTextSurfaceStyle } from "@/lib/profile/types";
import { uploadToPresignedUrl } from "@/lib/s3/upload-to-presigned-url";
import { cn } from "@/lib/utils";
import {
  getPointerCoordinatesFromEvent,
  getVerticalAutoScrollDelta,
} from "./profile-bento-drag-scroll";
import {
  getProfileBentoSuggestionGridItems,
  getProfileBentoSuggestionLayouts,
  ProfileBentoSuggestionCard,
  profileBentoSuggestionItemId,
} from "./profile-bento-empty-grid-state";
import {
  type CreatableBentoType,
  createAutoBentoItem,
  createPreviewDraftBentoId,
  isSpotifyLinkUrl,
  mergeLayoutsIntoBento,
  normalizeProfileBentoItems,
  toBentoGridItem,
  toBentoGridLayouts,
  toBentoItemTypeById,
} from "./profile-bento-grid-model";
import {
  materializePendingProfileBentoMediaUploads,
  type PendingProfileBentoMediaUpload,
  type PendingProfileBentoMediaUploadsById,
} from "./profile-bento-media-upload";
import { ProfileBentoSurfaceMotion } from "./profile-bento-readonly-profile-motion";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

type ProfileBentoInteractiveGridProps = {
  initialBento: ProfileBentoItem[];
  onPreviewModeChange: (mode: ProfileBentoGridPreviewMode) => void;
  previewMode: ProfileBentoGridPreviewMode;
  scrollViewportRef?: RefObject<HTMLElement | null>;
};

const createPayload = (items: ProfileBentoItem[], layouts: GridLayouts) => ({
  bento: mergeLayoutsIntoBento(items, layouts).map((item) => {
    if (item.type === "clock") {
      const content = { ...normalizeClockWidgetConfig(item.content), showSeconds: true };

      return {
        ...item,
        content: {
          showDate: content.showDate,
          showSeconds: content.showSeconds,
          style: content.style,
          timezone: content.timezone,
        },
      };
    }

    if (item.type === "text") {
      return {
        ...item,
        content: {
          ...item.content,
          url: item.content.url?.trim() || null,
        },
      };
    }

    if (item.type !== "link") {
      return item;
    }

    const { domain: _domain, ...content } = item.content;

    return {
      ...item,
      content: {
        ...content,
        description: "",
        favicon: content.favicon ?? "",
        thumbnail: content.thumbnail ?? "",
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
const PREVIEW_CANVAS_WIDTH = {
  desktop: 860,
  compact: 400,
} as const satisfies Record<GridBreakpoint, number>;
const CLOCK_TIMEZONE_OPTIONS = [
  { label: "Seoul", value: "Asia/Seoul" },
  { label: "Tokyo", value: "Asia/Tokyo" },
  { label: "Singapore", value: "Asia/Singapore" },
  { label: "Shanghai", value: "Asia/Shanghai" },
  { label: "Sydney", value: "Australia/Sydney" },
  { label: "London", value: "Europe/London" },
  { label: "Paris", value: "Europe/Paris" },
  { label: "New York", value: "America/New_York" },
  { label: "Los Angeles", value: "America/Los_Angeles" },
  { label: "UTC", value: "UTC" },
] as const;

const getClockTimezoneOptions = (timezone: string) => {
  if (CLOCK_TIMEZONE_OPTIONS.some((option) => option.value === timezone)) {
    return CLOCK_TIMEZONE_OPTIONS;
  }

  return [{ label: timezone, value: timezone }, ...CLOCK_TIMEZONE_OPTIONS];
};

function isVerticalScrollContainer(element: HTMLElement) {
  const overflowY = window.getComputedStyle(element).overflowY;

  return (
    (overflowY === "auto" || overflowY === "scroll" || overflowY === "overlay") &&
    element.scrollHeight > element.clientHeight
  );
}

function getVerticalScrollContainer(element: HTMLElement | null) {
  let current = element?.parentElement ?? null;

  while (current) {
    if (isVerticalScrollContainer(current)) {
      return current;
    }

    current = current.parentElement;
  }

  return document.scrollingElement instanceof HTMLElement ? document.scrollingElement : null;
}

function getVerticalAutoScrollContainer(
  preferredContainer: HTMLElement | null | undefined,
  fallbackElement: HTMLElement | null
) {
  if (preferredContainer && isVerticalScrollContainer(preferredContainer)) {
    return preferredContainer;
  }

  return getVerticalScrollContainer(fallbackElement);
}

function getVerticalAutoScrollBounds(scrollContainer: HTMLElement) {
  if (scrollContainer === document.scrollingElement) {
    return { bottom: window.innerHeight, top: 0 };
  }

  const rect = scrollContainer.getBoundingClientRect();

  return { bottom: rect.bottom, top: rect.top };
}

function applyVerticalAutoScroll(scrollContainer: HTMLElement, pointerY: number) {
  const bounds = getVerticalAutoScrollBounds(scrollContainer);
  const delta = getVerticalAutoScrollDelta(pointerY, bounds.top, bounds.bottom);

  if (delta === 0) {
    return;
  }

  const nextScrollTop = Math.max(
    0,
    Math.min(
      scrollContainer.scrollTop + delta,
      scrollContainer.scrollHeight - scrollContainer.clientHeight
    )
  );

  if (nextScrollTop !== scrollContainer.scrollTop) {
    scrollContainer.scrollTop = nextScrollTop;
  }
}

function ClockTimezoneControl({
  item,
  onTimezoneChange,
}: {
  item: Extract<ProfileBentoItem, { type: "clock" }>;
  onTimezoneChange: (id: string, timezone: string) => void;
}) {
  const content = { ...normalizeClockWidgetConfig(item.content), showSeconds: true };
  const timezone = content.timezone ?? "Asia/Seoul";
  const [selectedTimezone, setSelectedTimezone] = useState(timezone);
  const timezoneOptions = getClockTimezoneOptions(timezone);

  useEffect(() => {
    setSelectedTimezone(timezone);
  }, [timezone]);

  return (
    <Select
      items={timezoneOptions}
      onValueChange={(nextTimezone) => {
        if (typeof nextTimezone !== "string" || nextTimezone.length === 0) {
          return;
        }

        setSelectedTimezone(nextTimezone);
        onTimezoneChange(item.id, nextTimezone);
      }}
      value={selectedTimezone}
    >
      <SelectTrigger
        aria-label="Clock timezone"
        className="h-8 min-h-8 w-[9.25rem] rounded-md border-white/10 bg-transparent px-2 text-primary-foreground text-xs hover:bg-background/30 focus-visible:ring-white/30 [&_svg]:text-primary-foreground"
        size="sm"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="center" className="grid-action w-56" side="top" sideOffset={8}>
        <SelectGroup>
          {timezoneOptions.map((option) => {
            return (
              <SelectItem key={option.value} value={option.value}>
                <span className="font-medium">{option.label}</span>
                {/*<span className="text-muted-foreground text-xs">{option.value}</span>*/}
              </SelectItem>
            );
          })}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

function ClockBackgroundControl({
  item,
  onChange,
}: {
  item: Extract<ProfileBentoItem, { type: "clock" }>;
  onChange: (item: ProfileBentoItem) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const content = { ...normalizeClockWidgetConfig(item.content), showSeconds: true };
  const selectedBackgroundColorOption = getBackgroundColorOption(content.style.backgroundColor);

  return (
    <Popover
      open={isOpen}
      onOpenChange={(nextOpen) => {
        setIsOpen(nextOpen);
      }}
    >
      <PopoverTrigger
        render={
          <Button
            aria-label="Clock background color"
            aria-expanded={isOpen}
            className="size-8 rounded-sm border-0 bg-transparent p-1 text-primary-foreground shadow-none hover:bg-background/30 focus-visible:outline-none focus-visible:ring-0"
            size="icon"
            type="button"
            variant="ghost"
          >
            <span
              aria-hidden
              className="size-full rounded-full border border-white/20"
              style={{ backgroundColor: selectedBackgroundColorOption.value }}
            />
          </Button>
        }
      />
      <PopoverPanel
        align="center"
        className="flex w-auto flex-col gap-2 overflow-hidden rounded-lg border-0 bg-foreground p-1 shadow-float"
        side="top"
        sideOffset={8}
      >
        <RadioGroup
          aria-label="Clock background color options"
          className="grid grid-cols-8 gap-1 p-1 pt-1.5"
          onValueChange={(nextValue) => {
            const nextBackgroundColorOption = backgroundColorOptions.find(
              (option) => option.id === nextValue
            );

            if (!nextBackgroundColorOption) {
              return;
            }

            onChange({
              ...item,
              content: {
                ...content,
                style: {
                  ...content.style,
                  backgroundColor: nextBackgroundColorOption.value,
                },
              },
            });
          }}
          value={selectedBackgroundColorOption.id}
        >
          {backgroundColorOptions.map((option) => {
            return (
              <RadioGroupItem
                aria-label={option.label}
                className={`size-7 shrink-0 cursor-pointer rounded-full border border-white/20 shadow-none transition-[transform,opacity] focus-visible:ring-2 focus-visible:ring-ring/50 [&_[data-slot=radio-group-indicator]]:hidden data-checked:ring-2 data-checked:ring-white/90 ${option.className} ${option.checkedClassName}`}
                key={option.id}
                value={option.id}
              />
            );
          })}
        </RadioGroup>
      </PopoverPanel>
    </Popover>
  );
}

const getMetadataErrorMessage = (error: ApiError) => {
  if (typeof error.body !== "string") {
    return error.message;
  }

  try {
    const body = JSON.parse(error.body) as Partial<MetadataErrorResponse>;

    return body.message ?? error.message;
  } catch {
    return error.message;
  }
};

function createLinkBentoSkeleton(
  rawUrl: string,
  currentBento: ProfileBentoItem[]
): Extract<ProfileBentoItem, { type: "link" }> {
  const nextItem = createAutoBentoItem("link", currentBento, {
    layoutOverrides: isSpotifyLinkUrl(rawUrl)
      ? {
          desktop: { w: 2, h: 2 },
          compact: { w: 2, h: 2 },
        }
      : undefined,
  });

  if (nextItem.type !== "link") {
    throw new Error("Expected link bento item.");
  }

  return {
    ...nextItem,
    content: {
      title: "",
      description: "",
      favicon: "",
      domain: "",
      thumbnail: "",
      url: rawUrl,
      metadata: null,
    },
  };
}

function createLinkBentoFromCrawl(
  item: Extract<ProfileBentoItem, { type: "link" }>,
  rawUrl: string,
  data: NormalizedMetadata
): Extract<ProfileBentoItem, { type: "link" }> {
  const providerMetadata = data.providerMetadata;
  const githubContributionsMetadata = isGithubContributionsProviderMetadata(providerMetadata);
  const resolvedUrl =
    (githubContributionsMetadata ? providerMetadata.payload.profileUrl.trim() : "") ||
    data.url?.trim() ||
    rawUrl;
  let fallbackTitle = data.domain?.trim() || resolvedUrl;

  try {
    fallbackTitle = new URL(resolvedUrl).hostname.replace(/^www\./, "");
  } catch {
    fallbackTitle = data.domain?.trim() || resolvedUrl;
  }

  const githubFallbackTitle = githubContributionsMetadata
    ? providerMetadata.payload.name?.trim() || providerMetadata.payload.login
    : "";

  return {
    ...item,
    content: {
      title: data.title?.trim() || githubFallbackTitle || fallbackTitle,
      description: data.description?.trim() || "",
      favicon: data.favicon?.trim() || "",
      domain: data.domain?.trim() || fallbackTitle,
      thumbnail: githubContributionsMetadata ? "" : data.image?.trim() || "",
      url: resolvedUrl,
      metadata: data,
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

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger
        render={
          <Button
            aria-controls={isOpen ? inputId : undefined}
            aria-expanded={isOpen}
            aria-label={href ? "Edit media link" : "Add media link"}
            className={cn(
              "size-8 rounded-md border-0 bg-transparent p-1 text-primary-foreground shadow-none hover:bg-primary-foreground focus-visible:outline-none focus-visible:ring-0",
              href ? "!bg-green-400 !text-white hover:!bg-green-400" : "text-primary-foreground"
            )}
            size="icon"
            type="button"
            variant="ghost"
          >
            <Icon aria-hidden className="size-5" weight="bold" />
          </Button>
        }
      />
      {isOpen ? (
        <PopoverPanel
          align="end"
          className="grid-action z-50 w-64 rounded-xl border border-white/10 bg-foreground/95 p-1 shadow-float backdrop-blur-sm"
          side="bottom"
          sideOffset={10}
        >
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
        </PopoverPanel>
      ) : null}
    </Popover>
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

export function ProfileBentoInteractiveGrid({
  initialBento,
  onPreviewModeChange,
  previewMode,
  scrollViewportRef,
}: ProfileBentoInteractiveGridProps) {
  const profileEditor = useProfilePageEditor();
  const pathname = usePathname();
  const currentHandle = getProfileRouteHandle(pathname);
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
  const linkSuggestionInputRef = useRef<HTMLInputElement>(null);
  const mediaInputRef = useRef<HTMLInputElement>(null);
  const toolbarRef = useRef<HTMLElement>(null);
  const mediaObjectUrlsByIdRef = useRef<Record<string, string>>({});
  const pendingMediaUploadByIdRef = useRef<PendingProfileBentoMediaUploadsById>({});
  const removeTimerByIdRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const [pendingScrollItemId, setPendingScrollItemId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isCopied, setIsCopied] = useState(false);
  const [isSuggestionsHydrated, setIsSuggestionsHydrated] = useState(false);
  const [isSuggestionsDismissed, setIsSuggestionsDismissed] = useState(false);
  const [isLinkSuggestionPopoverOpen, setIsLinkSuggestionPopoverOpen] = useState(false);
  const [linkSuggestionPopoverRect, setLinkSuggestionPopoverRect] = useState<{
    left: number;
    top: number;
    width: number;
  } | null>(null);
  const linkSuggestionPopoverRef = useRef<HTMLDivElement>(null);
  const layoutInteractionDepthRef = useRef(0);
  const dragPointerRef = useRef<{ x: number; y: number } | null>(null);
  const {
    activeDragItemId,
    activeDragIntentItemId,
    cardRotate,
    cardX,
    isThinPlaceholderActive,
    startDragIntent,
    stopDragIntent,
    startDrag,
    stopDrag,
    startResize,
    stopResize,
    updateDragPointer,
  } = useGridDragMotion();
  const previewBreakpoint: GridBreakpoint = previewMode === "desktop" ? "desktop" : "compact";
  const isCompactCanvas = previewBreakpoint === "compact";
  const targetCanvasWidth = PREVIEW_CANVAS_WIDTH[previewBreakpoint];
  const canvasWidth =
    width > 0 && width < targetCanvasWidth && previewBreakpoint === "compact"
      ? width
      : targetCanvasWidth;
  const bentoById = useMemo(() => new Map(bento.map((item) => [item.id, item] as const)), [bento]);
  const bentoTypes = useMemo(
    () => new Set(bento.map((item) => item.type as CreatableBentoType)),
    [bento]
  );
  const hasLinkBento = bentoTypes.has("link");
  const itemTypeById = useMemo(() => toBentoItemTypeById(bento), [bento]);
  const suggestionGridItems = useMemo(
    () => (isSuggestionsDismissed ? [] : getProfileBentoSuggestionGridItems(bentoTypes)),
    [bentoTypes, isSuggestionsDismissed]
  );
  const gridItems = useMemo(
    () => [...bento.map(toBentoGridItem), ...suggestionGridItems],
    [bento, suggestionGridItems]
  );
  const suggestionLayouts = useMemo(
    () =>
      isSuggestionsDismissed
        ? { desktop: [], compact: [] }
        : getProfileBentoSuggestionLayouts(layouts, bentoTypes),
    [bentoTypes, isSuggestionsDismissed, layouts]
  );
  const cloneLayoutItems = useCallback(
    (items: readonly LayoutItem[] | undefined) => (items ?? []).map((item) => ({ ...item })),
    []
  );
  const combinedLayouts = useMemo(
    () => ({
      desktop: [
        ...cloneLayoutItems(layouts.desktop),
        ...cloneLayoutItems(suggestionLayouts.desktop),
      ],
      compact: [
        ...cloneLayoutItems(layouts.compact),
        ...cloneLayoutItems(suggestionLayouts.compact),
      ],
    }),
    [cloneLayoutItems, layouts, suggestionLayouts]
  );
  const linkSuggestionPlacementSignature = useMemo(() => {
    const serialize = (items: readonly LayoutItem[] | undefined) =>
      (items ?? []).map((item) => `${item.i}:${item.x}:${item.y}:${item.w}:${item.h}`).join("|");

    return `${serialize(combinedLayouts.desktop)}::${serialize(combinedLayouts.compact)}`;
  }, [combinedLayouts]);
  const linkSuggestionContainer = containerRef.current;
  const suggestionItemIds = useMemo(
    () => new Set(suggestionGridItems.map((item) => item.id)),
    [suggestionGridItems]
  );
  const currentPayload = useMemo(() => createPayload(bento, layouts), [bento, layouts]);
  const currentSnapshot = useMemo(() => JSON.stringify(currentPayload), [currentPayload]);
  const isDirty = currentSnapshot !== savedSnapshot;
  const hasProfileChanges = profileEditor.hasUnsyncedChanges;
  const isCrawlingLink = loadingLinkItemIds.size > 0;
  const isUploadingMedia = uploadingMediaItemIds.size > 0;
  const isSaving = isPending || profileEditor.isSyncing;
  const isPrimaryActionBusy = isSaving || isCrawlingLink || isUploadingMedia;
  const canSave = isDirty || hasProfileChanges;
  const primaryActionLabel = isPrimaryActionBusy
    ? "Saving"
    : isCopied
      ? "Copied"
      : canSave
        ? "Save"
        : "Share page";
  const isSectionDragActive =
    activeDragItemId !== null && itemTypeById.get(activeDragItemId) === "section";
  const isThinPlaceholderShapeActive = isThinPlaceholderActive || isSectionDragActive;
  const rowHeight = getGridRowHeight(canvasWidth, previewBreakpoint);
  const thinItemVisibleHeight = Math.round(rowHeight * 0.9);
  const [, verticalMargin] = GRID_MARGIN[previewBreakpoint];
  const gridMinHeight = getGridLayoutPixelHeight(
    combinedLayouts,
    previewBreakpoint,
    rowHeight,
    verticalMargin
  );
  const shouldReduceMotion = Boolean(useReducedMotion());
  useEffect(() => {
    if (activeDragItemId === null) {
      dragPointerRef.current = null;
      return;
    }

    let frame = 0;

    const step = () => {
      const pointer = dragPointerRef.current;
      const scrollContainer = getVerticalAutoScrollContainer(
        scrollViewportRef?.current,
        containerRef.current
      );

      if (pointer && scrollContainer) {
        applyVerticalAutoScroll(scrollContainer, pointer.y);
      }

      frame = window.requestAnimationFrame(step);
    };

    frame = window.requestAnimationFrame(step);

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [activeDragItemId, containerRef, scrollViewportRef]);

  useEffect(() => {
    if (activeDragItemId === null) {
      return;
    }

    const updatePointer = (event: PointerEvent | MouseEvent | TouchEvent) => {
      const pointer = getPointerCoordinatesFromEvent(event);

      if (pointer) {
        dragPointerRef.current = pointer;
      }
    };

    window.addEventListener("pointermove", updatePointer, { passive: true });
    window.addEventListener("mousemove", updatePointer, { passive: true });
    window.addEventListener("touchmove", updatePointer, { passive: true });

    return () => {
      window.removeEventListener("pointermove", updatePointer);
      window.removeEventListener("mousemove", updatePointer);
      window.removeEventListener("touchmove", updatePointer);
    };
  }, [activeDragItemId]);
  const interactiveShellClassName = cn(
    "relative flex min-w-0 flex-1 flex-col gap-4 pb-40",
    isCompactCanvas
      ? "mx-auto w-[360px] max-w-full flex-none items-center sm:w-[400px]"
      : "xl:w-[860px] xl:flex-none xl:items-stretch 2xl:w-[860px]"
  );
  const gridClassName = cn(
    "max-w-full [&_.react-draggable-dragging]:z-40! [&_.react-grid-item:not(.react-grid-placeholder)]:z-10 [&_.react-grid-item:hover]:z-30! [&_.react-grid-item:focus-within]:z-30! [&_.react-grid-item]:duration-[600ms]! [&_.react-grid-item]:ease-out! [&_.react-resizable-handle]:hidden! [&_.react-resizable-handle]:pointer-events-none! [&_.react-grid-placeholder]:z-0! [&_.react-grid-placeholder]:bg-secondary! [&_.react-grid-placeholder]:opacity-100! [&_.react-grid-placeholder]:shadow-[inset_0_1px_6px_rgb(0_0_0_/_0.08),inset_0_-1px_1px_rgb(255_255_255_/_0.8)]!",
    "w-full",
    isThinPlaceholderShapeActive
      ? "[&_.react-grid-placeholder]:h-[var(--thin-placeholder-height)]! [&_.react-grid-placeholder]:translate-y-[var(--thin-placeholder-offset)]! [&_.react-grid-placeholder]:rounded-2xl!"
      : "[&_.react-grid-placeholder]:rounded-[1.5rem]!"
  );
  const gridStyle = {
    "--thin-placeholder-height": `${thinItemVisibleHeight}px`,
    "--thin-placeholder-offset": `${rowHeight * 2 + verticalMargin - thinItemVisibleHeight}px`,
    "--thin-item-visible-height": `${thinItemVisibleHeight}px`,
  } as CSSProperties;

  const handlePreviewModeChange = useCallback(onPreviewModeChange, [onPreviewModeChange]);

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
    if (!isCopied) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setIsCopied(false);
    }, 2000);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [isCopied]);

  useEffect(() => {
    try {
      const storageKey = "profile-bento:suggestions-dismissed";
      const storedValue = window.localStorage.getItem(storageKey);

      setIsSuggestionsDismissed(storedValue === "true");
    } catch {
      // Fall back to showing the suggestions when storage is unavailable.
      setIsSuggestionsDismissed(false);
    } finally {
      setIsSuggestionsHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (hasLinkBento) {
      setIsLinkSuggestionPopoverOpen(false);
    }
  }, [hasLinkBento]);

  useLayoutEffect(() => {
    void linkSuggestionPlacementSignature;

    if (!isLinkSuggestionPopoverOpen) {
      setLinkSuggestionPopoverRect(null);
      return;
    }

    const updatePopoverPosition = () => {
      const container = linkSuggestionContainer;
      const item = container?.querySelector<HTMLElement>(
        `[data-profile-bento-grid-item-id="${CSS.escape(profileBentoSuggestionItemId("link"))}"]`
      );

      if (!container || !item) {
        setLinkSuggestionPopoverRect(null);
        return;
      }

      const containerRect = container.getBoundingClientRect();
      const itemRect = item.getBoundingClientRect();

      setLinkSuggestionPopoverRect({
        left: itemRect.left - containerRect.left,
        top: itemRect.bottom - containerRect.top + 12,
        width: Math.max(itemRect.width, 280),
      });
    };

    updatePopoverPosition();

    const container = linkSuggestionContainer;
    const item = container?.querySelector<HTMLElement>(
      `[data-profile-bento-grid-item-id="${CSS.escape(profileBentoSuggestionItemId("link"))}"]`
    );
    const resizeObserver = new ResizeObserver(updatePopoverPosition);

    if (container) {
      resizeObserver.observe(container);
    }

    if (item) {
      resizeObserver.observe(item);
    }

    window.addEventListener("resize", updatePopoverPosition);
    window.addEventListener("scroll", updatePopoverPosition, true);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updatePopoverPosition);
      window.removeEventListener("scroll", updatePopoverPosition, true);
    };
  }, [isLinkSuggestionPopoverOpen, linkSuggestionPlacementSignature, linkSuggestionContainer]);

  useEffect(() => {
    if (!isLinkSuggestionPopoverOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const popover = linkSuggestionPopoverRef.current;
      const container = linkSuggestionContainer;
      const target = event.target;

      if (!popover || !(target instanceof Node)) {
        return;
      }

      if (popover.contains(target)) {
        return;
      }

      const linkSuggestionItem = container?.querySelector<HTMLElement>(
        `[data-profile-bento-grid-item-id="${CSS.escape(profileBentoSuggestionItemId("link"))}"]`
      );

      if (linkSuggestionItem?.contains(target)) {
        return;
      }

      setIsLinkSuggestionPopoverOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);

    const frame = requestAnimationFrame(() => {
      linkSuggestionInputRef.current?.focus();
    });

    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [isLinkSuggestionPopoverOpen, linkSuggestionContainer]);

  useEffect(() => {
    const removeTimerById = removeTimerByIdRef.current;

    return () => {
      for (const timer of Object.values(removeTimerById)) {
        clearTimeout(timer);
      }

      for (const objectUrl of Object.values(mediaObjectUrlsByIdRef.current)) {
        URL.revokeObjectURL(objectUrl);
      }

      pendingMediaUploadByIdRef.current = {};
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

  const handleGridDragStart = useCallback(
    (newItem: LayoutItem | null | undefined, event: Event) => {
      layoutInteractionDepthRef.current += 1;
      dragPointerRef.current = getPointerCoordinatesFromEvent(event);
      startDrag(newItem, event);
    },
    [startDrag]
  );

  const handleGridDragStop = useCallback(() => {
    layoutInteractionDepthRef.current = Math.max(0, layoutInteractionDepthRef.current - 1);
    dragPointerRef.current = null;
    stopDrag();
  }, [stopDrag]);

  const handleGridDrag = useCallback(
    (event: Event) => {
      updateDragPointer(event);
      dragPointerRef.current = getPointerCoordinatesFromEvent(event);
    },
    [updateDragPointer]
  );

  const handleGridResizeStart = useCallback(
    (newItem: LayoutItem | null | undefined) => {
      startResize(newItem);
    },
    [startResize]
  );

  const handleGridResizeStop = useCallback(() => {
    stopResize();
  }, [stopResize]);

  const removeItemFromGrid = useCallback((id: string) => {
    const objectUrl = mediaObjectUrlsByIdRef.current[id];

    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
      delete mediaObjectUrlsByIdRef.current[id];
    }

    delete pendingMediaUploadByIdRef.current[id];

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
  const updateClockTimezone = useCallback((id: string, timezone: string) => {
    setBento((currentItems) =>
      currentItems.map((item) => {
        if (item.id !== id || item.type !== "clock") {
          return item;
        }

        return {
          ...item,
          content: {
            ...normalizeClockWidgetConfig(item.content),
            showSeconds: true,
            timezone,
          },
        };
      })
    );
  }, []);
  const updateTextSurface = useCallback((id: string, nextStyle: ProfileTextSurfaceStyle) => {
    setBento((currentItems) =>
      currentItems.map((item) =>
        item.id === id && item.type === "text"
          ? {
              ...item,
              content: {
                ...item.content,
                style: nextStyle,
              },
            }
          : item
      )
    );
  }, []);
  const updateTextUrl = useCallback((id: string, nextUrl: string | null) => {
    setBento((currentItems) =>
      currentItems.map((item) =>
        item.id === id && item.type === "text"
          ? {
              ...item,
              content: {
                ...item.content,
                url: nextUrl?.trim() ? nextUrl.trim() : null,
              },
            }
          : item
      )
    );
  }, []);

  const handleLinkCrawl = async (inputUrl = linkUrl) => {
    const rawUrl = normalizeLinkInputUrl(inputUrl);

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
      const response = await getMetadata({ url: rawUrl });

      if (response.status !== 200) {
        throw new Error("Could not fetch link details");
      }

      const nextItem = createLinkBentoFromCrawl(placeholderItem, rawUrl, response.data);

      setBento((currentItems) =>
        currentItems.map((item) => (item.id === placeholderItem.id ? nextItem : item))
      );
      removeLoadingLinkId(placeholderItem.id);
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? getMetadataErrorMessage(error)
          : error instanceof Error
            ? error.message
            : "Could not fetch link details"
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
    setItemMotionPhaseById((current) => ({ ...current, [placeholderItem.id]: "entering" }));
    setFocusItemId(null);
    setBento(nextBento);
    setLayouts(toBentoGridLayouts(nextBento));

    if (!mediaObjectUrlsByIdRef.current[placeholderItem.id]) {
      return;
    }

    pendingMediaUploadByIdRef.current[placeholderItem.id] = {
      file: uploadFile,
      uploaded: false,
    };
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
      const syncDraftData = profileEditor.data;

      if (!syncDraftData) {
        return;
      }

      const pendingMediaUploadIds = Object.entries(pendingMediaUploadByIdRef.current)
        .filter(([id, upload]) => bentoById.has(id) && !upload.uploaded)
        .map(([id]) => id);

      try {
        const pendingMediaUploads = pendingMediaUploadIds
          .map((id) => [id, pendingMediaUploadByIdRef.current[id]] as const)
          .filter((entry): entry is readonly [string, PendingProfileBentoMediaUpload] =>
            Boolean(entry[1])
          );
        const pendingProfileImageUpload = profileEditor.uploadPendingImages(syncDraftData);

        if (pendingMediaUploadIds.length > 0) {
          setUploadingMediaItemIds((current) => new Set([...current, ...pendingMediaUploadIds]));
        }

        const pendingMediaUploadTask = Promise.all(
          pendingMediaUploads.map(async ([id, upload]) => {
            const contentHash = await getProfileBentoMediaHash(upload.file);
            const previewBentoId = createPreviewDraftBentoId(id);
            const response = await uploadProfileBentoMedia({
              bentoId: previewBentoId,
              contentHash,
              contentLength: upload.file.size,
              contentType: upload.file.type,
            });

            if (response.status !== 200) {
              throw new Error("Failed to upload bento media");
            }

            const mediaUpload = response.data;

            await uploadToPresignedUrl({
              contentType: mediaUpload.contentType,
              file: upload.file,
              uploadUrl: mediaUpload.uploadUrl,
            });

            return [
              id,
              {
                ...upload,
                uploaded: true,
                contentHash: mediaUpload.contentHash,
                contentType: mediaUpload.contentType,
                mediaType: mediaUpload.mediaType,
                tempObjectKey: mediaUpload.tempObjectKey,
                tempUrl: mediaUpload.tempUrl,
                uploadUrl: mediaUpload.uploadUrl,
              },
            ] as const;
          })
        );

        const [nextDraftData, uploadedMedia] = await Promise.all([
          pendingProfileImageUpload,
          pendingMediaUploadTask,
        ]);

        for (const [id, upload] of uploadedMedia) {
          pendingMediaUploadByIdRef.current[id] = upload;
        }

        if (hasProfileChanges || isDirty) {
          const payloadBento = isDirty
            ? materializePendingProfileBentoMediaUploads(bento, pendingMediaUploadByIdRef.current)
            : null;
          const response = await profileEditor.handleSync(
            payloadBento
              ? {
                  draftDataOverride: nextDraftData,
                  bento: createPayload(payloadBento, layouts)
                    .bento as UpdateProfilePageBodyBentoItem[],
                }
              : { draftDataOverride: nextDraftData }
          );

          if (!response || response.status !== 200) {
            return;
          }

          const responseData = response.data;
          const normalizedResponseBento = normalizeProfileBentoItems(
            responseData.bento as ProfileBentoItem[]
          );
          const nextLayouts = toBentoGridLayouts(normalizedResponseBento);

          for (const id of pendingMediaUploadIds) {
            const objectUrl = mediaObjectUrlsByIdRef.current[id];

            if (objectUrl) {
              URL.revokeObjectURL(objectUrl);
              delete mediaObjectUrlsByIdRef.current[id];
            }

            delete pendingMediaUploadByIdRef.current[id];
          }

          setBento(normalizedResponseBento);
          setLayouts(nextLayouts);
          setSavedSnapshot(createPayloadSnapshot(normalizedResponseBento, nextLayouts));
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to sync bento");
      } finally {
        if (pendingMediaUploadIds.length > 0) {
          setUploadingMediaItemIds((current) => {
            if (current.size === 0) {
              return current;
            }

            const next = new Set(current);

            for (const id of pendingMediaUploadIds) {
              next.delete(id);
            }

            return next;
          });
        }
      }
    });
  };

  const copyMyPage = async () => {
    try {
      await navigator.clipboard.writeText(`${appConfig.url}${getProfileAppPath(currentHandle)}`);
      setIsCopied(true);
    } catch {
      toast.error("Failed to copy page URL");
    }
  };

  const handlePrimaryAction = () => {
    if (isPrimaryActionBusy) {
      return;
    }

    if (canSave) {
      save();
      return;
    }

    void copyMyPage();
  };

  return (
    <div className={interactiveShellClassName} style={{ minHeight: gridMinHeight }}>
      <motion.header
        animate={{ opacity: 1, y: 0 }}
        className="fixed bottom-10 left-1/2 z-50 flex w-auto -translate-x-1/2 flex-col items-center justify-center rounded-2xl bg-background p-2.5 shadow-float backdrop-blur"
        layout
        initial={shouldReduceMotion ? { opacity: 0, y: 8 } : { opacity: 0, y: 18 }}
        ref={toolbarRef}
        transition={{
          ...TOOLBAR_EXPAND_TRANSITION,
          delay: shouldReduceMotion ? 0.06 : 0.16,
        }}
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
                <Field className="relative rounded-lg !bg-inherit py-1 outline-none">
                  <InputGroup className="border-0 !bg-inherit ring-0 has-[[data-slot=input-group-control]:focus-visible]:border-transparent has-[[data-slot=input-group-control]:focus-visible]:ring-0">
                    <InputGroupInput
                      aria-label="Link URL"
                      className="text-sm! h-10 px-1"
                      disabled={!isLinkInputOpen || isCrawlingLink}
                      id="profile-bento-link-url"
                      onPaste={(event) => {
                        if (!isLinkInputOpen || isCrawlingLink) {
                          return;
                        }

                        const pastedText = event.clipboardData.getData("text/plain").trim();

                        if (!pastedText) {
                          return;
                        }

                        event.preventDefault();
                        void handleLinkCrawl(pastedText);
                      }}
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
                    <InputGroupAddon align="inline-end" className="pr-2">
                      <InputGroupButton
                        aria-label="Fetch link details"
                        className="h-8 border-0 bg-background px-3 font-semibold text-base text-black shadow-sm"
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
          <Button
            aria-busy={isPrimaryActionBusy}
            disabled={isPrimaryActionBusy}
            onClick={handlePrimaryAction}
            type="button"
            size={"lg"}
            className={"brand-button w-36 font-semibold py-5 text-base shadow-none border-0"}
          >
            {isSaving ? <SpinnerGapIcon className="size-4 animate-spin" /> : null}
            {!isSaving && isCopied ? <CheckIcon className="size-4" /> : null}
            <span>{primaryActionLabel}</span>
          </Button>
          <Separator
            orientation="vertical"
            className={"data-vertical:w-[3px] my-3 rounded-lg mx-2"}
          />
          <ProfileBentoGridActions
            onAddItem={addItem}
            onRequestMediaInput={() => mediaInputRef.current?.click()}
            onPreviewModeChange={handlePreviewModeChange}
            onToggleLinkInput={() => setIsLinkInputOpen((current) => !current)}
            previewMode={previewMode}
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
        </div>
      </motion.header>

      <ProfileBentoSurfaceMotion
        className="w-full"
        delay={0.5}
        duration={0.78}
        initialScale={0.96}
        initialY={18}
        reduceMotionDuration={0.42}
        reduceMotionY={8}
      >
        <div
          className={cn(
            gridClassName,
            isCompactCanvas
              ? "relative flex min-h-0 w-full flex-none"
              : "relative flex min-h-0 flex-1"
          )}
          ref={containerRef}
          style={gridStyle}
        >
          {mounted ? (
            <ResponsiveGridCanvas
              activeBreakpoint={previewBreakpoint}
              activeDragItemId={activeDragItemId}
              activeDragIntentItemId={activeDragIntentItemId}
              cardRotate={cardRotate}
              cardX={cardX}
              items={gridItems}
              layouts={combinedLayouts}
              plainItemIds={suggestionItemIds}
              mounted={mounted}
              onDrag={handleGridDrag}
              onDragStart={handleGridDragStart}
              onDragStop={handleGridDragStop}
              onDragIntentStart={startDragIntent}
              onDragIntentStop={stopDragIntent}
              onItemMotionComplete={completeItemMotion}
              onLayoutChange={(nextLayouts) => {
                if (activeDragItemId === null && layoutInteractionDepthRef.current === 0) {
                  return;
                }

                const nextActualLayouts = {
                  desktop: (nextLayouts.desktop ?? []).filter(
                    (layoutItem) => !suggestionItemIds.has(layoutItem.i)
                  ),
                  compact: (nextLayouts.compact ?? []).filter(
                    (layoutItem) => !suggestionItemIds.has(layoutItem.i)
                  ),
                };

                setLayouts(normalizeLayouts(nextActualLayouts, itemTypeById));
              }}
              onRemoveItem={removeItem}
              onResizeItem={resizeItem}
              onTextSurfaceChange={updateTextSurface}
              onResizeStart={handleGridResizeStart}
              onResizeStop={handleGridResizeStop}
              getItemMotionPhase={getItemMotionPhase}
              onTextUrlChange={updateTextUrl}
              renderItem={(gridItem) => {
                if (suggestionItemIds.has(gridItem.id)) {
                  return (
                    <ProfileBentoSuggestionCard
                      activeBreakpoint={previewBreakpoint}
                      isActive={gridItem.itemType === "link" && isLinkSuggestionPopoverOpen}
                      onAddItem={addItem}
                      onRequestLinkInput={() => {
                        setIsLinkInputOpen(false);
                        setLinkUrl("");
                        setIsLinkSuggestionPopoverOpen(true);
                      }}
                      onRequestMediaInput={() => mediaInputRef.current?.click()}
                      type={gridItem.itemType as CreatableBentoType}
                    />
                  );
                }

                const item = bentoById.get(gridItem.id);
                const activeLayout =
                  layouts[previewBreakpoint]?.find((layoutItem) => layoutItem.i === gridItem.id) ??
                  item?.layout[previewBreakpoint];
                const layoutSize = activeLayout
                  ? getProfileBentoLinkSize(activeLayout.w, activeLayout.h)
                  : undefined;

                return item ? (
                  <ProfileBentoEditableContentCard
                    activeBreakpoint={previewBreakpoint}
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

                return item?.type === "clock" ? (
                  <>
                    <ClockTimezoneControl item={item} onTimezoneChange={updateClockTimezone} />
                    <ClockBackgroundControl item={item} onChange={updateItem} />
                  </>
                ) : item?.type === "media" ? (
                  <MediaLinkControl item={item} onChange={updateItem} />
                ) : item?.type === "map" ? (
                  <Button
                    aria-label={
                      activeMapInteractionItemId === item.id
                        ? "Disable map interaction"
                        : "Enable map interaction"
                    }
                    aria-pressed={activeMapInteractionItemId === item.id}
                    className="size-8.5 min-h-8 min-w-8 rounded-md text-primary-foreground hover:bg-primary-foreground hover:text-primary aria-pressed:bg-green-400 aria-pressed:text-primary-foreground"
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
              width={canvasWidth}
            />
          ) : null}
          {isLinkSuggestionPopoverOpen && linkSuggestionPopoverRect ? (
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              className="absolute z-40"
              initial={{ opacity: 0, y: -6 }}
              ref={linkSuggestionPopoverRef}
              style={{
                left: linkSuggestionPopoverRect.left,
                top: linkSuggestionPopoverRect.top,
                width: linkSuggestionPopoverRect.width,
              }}
              transition={TOOLBAR_EXPAND_TRANSITION}
            >
              <div className="rounded-2xl bg-background/90 p-1.5 px-2 shadow-float backdrop-blur">
                <form
                  className="w-full"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void handleLinkCrawl();
                  }}
                >
                  <Field className="relative rounded-lg !bg-inherit py-1 outline-none">
                    <InputGroup className="border-0 !bg-inherit ring-0 has-[[data-slot=input-group-control]:focus-visible]:border-transparent has-[[data-slot=input-group-control]:focus-visible]:ring-0">
                      <InputGroupInput
                        aria-label="Link URL"
                        className="text-sm! h-10 px-1"
                        disabled={isCrawlingLink}
                        onPaste={(event) => {
                          if (isCrawlingLink) {
                            return;
                          }

                          const pastedText = event.clipboardData.getData("text/plain").trim();

                          if (!pastedText) {
                            return;
                          }

                          event.preventDefault();
                          void handleLinkCrawl(pastedText);
                        }}
                        onChange={(event) => setLinkUrl(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key !== "Enter") {
                            return;
                          }

                          event.preventDefault();
                          void handleLinkCrawl();
                        }}
                        placeholder="https://example.com"
                        ref={linkSuggestionInputRef}
                        value={linkUrl}
                      />
                      <InputGroupAddon align="inline-end" className="pr-2">
                        <InputGroupButton
                          aria-label="Fetch link details"
                          className="h-8 border-0 bg-background px-3 font-semibold text-base text-black shadow-sm"
                          disabled={isCrawlingLink || !linkUrl.trim()}
                          type="submit"
                          variant="outline"
                        >
                          {isCrawlingLink ? <span>Getting...</span> : <span>Get</span>}
                        </InputGroupButton>
                      </InputGroupAddon>
                    </InputGroup>
                  </Field>
                </form>
              </div>
            </motion.div>
          ) : null}
        </div>
      </ProfileBentoSurfaceMotion>
      {isSuggestionsHydrated && !isSuggestionsDismissed ? (
        <Button
          className="fixed right-10 bottom-12 z-30 rounded-xl bg-background px-6 py-5 text-sm font-bold shadow-float hover:bg-secondary/30"
          onClick={() => {
            try {
              window.localStorage.setItem("profile-bento:suggestions-dismissed", "true");
            } catch {
              // Ignore storage failures and keep the in-memory dismissal state.
            }

            setIsSuggestionsDismissed(true);
          }}
          type="button"
          variant="ghost"
        >
          Remove Suggestions
        </Button>
      ) : null}
    </div>
  );
}
