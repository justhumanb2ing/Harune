import { ArrowCircleUpRightIcon } from "@phosphor-icons/react";
import Image from "next/image";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { PlaylistIframe } from "@/components/profile/playlist-iframe";
import {
  Map as BentoMap,
  MapControls,
  MapMarker,
  type MapViewport,
  MarkerContent,
} from "@/components/ui/map";
import type { GridBreakpoint, ResizeOptionId } from "@/lib/grid/grid-types";
import type { ProfileBentoItem } from "@/lib/profile/types";
import { cn } from "@/lib/utils";

type ProfileBentoLinkSize = ResizeOptionId;
type ProfileBentoEditableContentCardProps = {
  autoFocus?: boolean;
  activeBreakpoint?: GridBreakpoint;
  isLoading?: boolean;
  item: ProfileBentoItem;
  layoutSize?: ProfileBentoLinkSize;
  mapInteractionEnabled?: boolean;
  onChange: (item: ProfileBentoItem) => void;
  onFocusReady?: () => void;
};

export function ProfileBentoEditableGridCard({ item }: { item: ProfileBentoItem }) {
  return <ProfileBentoGridCardContent item={item} preventNavigation />;
}

export const ProfileBentoEditableContentCard = memo(function ProfileBentoEditableContentCard({
  autoFocus = false,
  activeBreakpoint = "desktop",
  isLoading = false,
  item,
  layoutSize,
  mapInteractionEnabled = false,
  onChange,
  onFocusReady,
}: ProfileBentoEditableContentCardProps) {
  if (isLoading) {
    return <ProfileBentoLinkSkeleton />;
  }

  if (item.type === "link") {
    return (
      <EditableLinkBento
        activeBreakpoint={activeBreakpoint}
        item={item}
        layoutSize={layoutSize}
        onChange={onChange}
      />
    );
  }

  if (item.type === "text") {
    return (
      <EditableTextBento
        autoFocus={autoFocus}
        item={item}
        onChange={onChange}
        onFocusReady={onFocusReady}
      />
    );
  }

  if (item.type === "section") {
    return (
      <EditableSectionBento
        autoFocus={autoFocus}
        item={item}
        onChange={onChange}
        onFocusReady={onFocusReady}
      />
    );
  }

  if (item.type === "media") {
    return <EditableMediaBento item={item} onChange={onChange} />;
  }

  if (item.type === "map") {
    return (
      <EditableMapBento
        isInteractionEnabled={mapInteractionEnabled}
        item={item}
        onChange={onChange}
      />
    );
  }

  return <ProfileBentoEditableGridCard item={item} />;
}, areProfileBentoEditableContentCardPropsEqual);

function areProfileBentoEditableContentCardPropsEqual(
  previous: ProfileBentoEditableContentCardProps,
  next: ProfileBentoEditableContentCardProps
) {
  return (
    previous.activeBreakpoint === next.activeBreakpoint &&
    previous.autoFocus === next.autoFocus &&
    previous.isLoading === next.isLoading &&
    previous.item === next.item &&
    previous.layoutSize === next.layoutSize &&
    previous.mapInteractionEnabled === next.mapInteractionEnabled
  );
}

export function getProfileBentoLinkSize(w: number, h: number): ProfileBentoLinkSize {
  if (w === 2 && h === 1) {
    return "2x1";
  }

  if (w === 2 && h === 2) {
    return "2x2";
  }

  if (w === 2 && h === 4) {
    return "2x4";
  }

  if (w === 1 && h === 4) {
    return "1x4";
  }

  return "1x2";
}

function LinkFavicon({
  favicon,
  title,
  className,
}: {
  favicon: string | null;
  title: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-sm",
        className
      )}
    >
      {favicon ? (
        <Image
          alt=""
          className="size-full object-cover"
          height={32}
          src={favicon}
          unoptimized
          width={32}
        />
      ) : (
        <span className="size-3 rounded-full bg-secondary" aria-hidden />
      )}
      <span className="sr-only">{title ? `${title} favicon` : "Link favicon"}</span>
    </span>
  );
}

function EditableLinkFavicon({
  favicon,
  href,
  title,
}: {
  favicon: string | null;
  href: string;
  title: string;
}) {
  return (
    <a
      aria-label={title ? `Open ${title}` : "Open link"}
      className="grid-action inline-flex size-8 shrink-0 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
      href={href}
      rel="noreferrer"
      target="_blank"
    >
      <LinkFavicon favicon={favicon} title={title} />
    </a>
  );
}

function LinkTitleInput({
  item,
  onChange,
  className,
}: {
  item: Extract<ProfileBentoItem, { type: "link" }>;
  onChange: (item: ProfileBentoItem) => void;
  className?: string;
}) {
  return (
    <input
      aria-label="Link title"
      className={cn(
        "grid-action min-h-9 min-w-0 rounded-md bg-transparent px-0 py-1.5 font-medium text-sm outline-none transition-colors placeholder:text-muted-foreground hover:bg-secondary focus-visible:bg-secondary truncate",
        className
      )}
      onChange={(event) => {
        onChange({
          ...item,
          content: { ...item.content, title: event.target.value },
        });
      }}
      placeholder="Link title"
      value={item.content.title}
    />
  );
}

function LinkTitleText({ title, className }: { title: string; className?: string }) {
  return (
    <h2
      className={cn(
        "min-h-9 min-w-0 truncate rounded-md px-0 py-1.5 font-medium text-sm",
        className
      )}
    >
      {title}
    </h2>
  );
}

function ReadonlyLinkTitle({ title, className }: { title: string; className?: string }) {
  return <LinkTitleText title={title} className={className} />;
}

function LinkThumbnail({ thumbnail, className }: { thumbnail: string | null; className?: string }) {
  return (
    <div className={cn("relative overflow-hidden rounded-md bg-muted", className)}>
      {thumbnail ? (
        <Image
          alt=""
          className="object-cover"
          fill
          sizes="(min-width: 1024px) 25vw, 50vw"
          src={thumbnail}
        />
      ) : null}
    </div>
  );
}

function LinkUrlText({ url }: { url: string }) {
  return (
    <div className="min-w-0 max-w-full text-muted-foreground text-xs">
      <p className="min-w-0 max-w-full truncate line-clamp-1">{url}</p>
    </div>
  );
}

function ReadonlyLinkBento({
  item,
  layoutSize,
}: {
  item: Extract<ProfileBentoItem, { type: "link" }>;
  layoutSize: ProfileBentoLinkSize;
}) {
  if (layoutSize === "2x1") {
    return (
      <article className="flex size-full min-h-0 items-center gap-3 overflow-hidden rounded-lg p-2">
        <LinkFavicon favicon={item.content.favicon} title={item.content.title} />
        <ReadonlyLinkTitle title={item.content.title} className="flex-1" />
      </article>
    );
  }

  if (layoutSize === "2x2") {
    return (
      <article className="flex size-full min-h-0 gap-3 overflow-hidden rounded-lg p-2">
        <div className="flex min-w-0 flex-1 flex-col justify-between">
          <div className="flex min-w-0 flex-1 flex-col gap-3">
            <LinkFavicon favicon={item.content.favicon} title={item.content.title} />
            <ReadonlyLinkTitle title={item.content.title} className="w-full" />
          </div>
          <LinkUrlText url={item.content.url} />
        </div>
        <LinkThumbnail thumbnail={item.content.thumbnail} className="h-full w-[46%] shrink-0" />
      </article>
    );
  }

  if (layoutSize === "2x4") {
    return (
      <article className="flex size-full min-h-0 flex-col justify-between gap-3 overflow-hidden rounded-lg p-2">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col justify-between">
          <div className="flex min-w-0 flex-1 flex-col gap-3">
            <LinkFavicon favicon={item.content.favicon} title={item.content.title} />
            <ReadonlyLinkTitle title={item.content.title} className="w-full" />
          </div>
          <LinkUrlText url={item.content.url} />
        </div>
        <LinkThumbnail thumbnail={item.content.thumbnail} className="h-[58%] w-full shrink-0" />
      </article>
    );
  }

  if (layoutSize === "1x4") {
    return (
      <article className="flex size-full min-h-0 flex-col justify-between gap-3 overflow-hidden rounded-lg p-2">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col justify-between">
          <div className="flex min-w-0 flex-1 flex-col gap-3">
            <LinkFavicon favicon={item.content.favicon} title={item.content.title} />
            <ReadonlyLinkTitle title={item.content.title} className="w-full" />
          </div>
          <LinkUrlText url={item.content.url} />
        </div>
        <LinkThumbnail thumbnail={item.content.thumbnail} className="h-[42%] w-full shrink-0" />
      </article>
    );
  }

  return (
    <article className="flex size-full min-h-0 flex-col gap-3 overflow-hidden rounded-lg p-2">
      <LinkFavicon favicon={item.content.favicon} title={item.content.title} />
      <ReadonlyLinkTitle title={item.content.title} className="w-full" />
    </article>
  );
}

function EditableLinkBento({
  activeBreakpoint,
  item,
  layoutSize,
  onChange,
}: {
  activeBreakpoint: GridBreakpoint;
  item: Extract<ProfileBentoItem, { type: "link" }>;
  layoutSize?: ProfileBentoLinkSize;
  onChange: (item: ProfileBentoItem) => void;
}) {
  const activeLayout = item.layout[activeBreakpoint];
  const size = layoutSize ?? getProfileBentoLinkSize(activeLayout.w, activeLayout.h);

  if (size === "2x1") {
    return (
      <article className="flex size-full min-h-0 items-center gap-3 overflow-hidden rounded-lg p-2">
        <EditableLinkFavicon
          favicon={item.content.favicon}
          href={item.content.url}
          title={item.content.title}
        />
        <LinkTitleInput item={item} onChange={onChange} className="flex-1" />
      </article>
    );
  }

  if (size === "2x2") {
    return (
      <article className="flex size-full min-h-0 gap-3 overflow-hidden rounded-lg p-2">
        <div className="flex min-w-0 flex-1 flex-col justify-between">
          <div className="flex min-w-0 flex-1 flex-col gap-3">
            <EditableLinkFavicon
              favicon={item.content.favicon}
              href={item.content.url}
              title={item.content.title}
            />
            <LinkTitleInput item={item} onChange={onChange} className="w-full" />
          </div>
          <LinkUrlText url={item.content.url} />
        </div>

        <LinkThumbnail thumbnail={item.content.thumbnail} className="h-full w-[46%] shrink-0" />
      </article>
    );
  }

  if (size === "2x4") {
    return (
      <article className="flex size-full min-h-0 flex-col justify-between gap-3 overflow-hidden rounded-lg p-2">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col justify-between">
          <div className="flex min-w-0 flex-1 flex-col gap-3">
            <EditableLinkFavicon
              favicon={item.content.favicon}
              href={item.content.url}
              title={item.content.title}
            />
            <LinkTitleInput item={item} onChange={onChange} className="w-full" />
          </div>
          <LinkUrlText url={item.content.url} />
        </div>
        <LinkThumbnail thumbnail={item.content.thumbnail} className="h-[58%] w-full shrink-0" />
      </article>
    );
  }

  if (size === "1x4") {
    return (
      <article className="flex size-full min-h-0 flex-col justify-between gap-3 overflow-hidden rounded-lg p-2">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col justify-between">
          <div className="flex min-w-0 flex-1 flex-col gap-3">
            <EditableLinkFavicon
              favicon={item.content.favicon}
              href={item.content.url}
              title={item.content.title}
            />
            <LinkTitleInput item={item} onChange={onChange} className="w-full" />
          </div>
          <LinkUrlText url={item.content.url} />
        </div>
        <LinkThumbnail thumbnail={item.content.thumbnail} className="h-[42%] w-full shrink-0" />
      </article>
    );
  }

  return (
    <article className="flex size-full min-h-0 flex-col gap-3 overflow-hidden rounded-lg p-2">
      <EditableLinkFavicon
        favicon={item.content.favicon}
        href={item.content.url}
        title={item.content.title}
      />
      <LinkTitleInput item={item} onChange={onChange} className="w-full" />
    </article>
  );
}

function ProfileBentoLinkSkeleton() {
  return (
    <article className="grid-action flex size-full min-h-0 flex-col gap-3 overflow-hidden rounded-lg p-3">
      <div className="h-5 w-3/4 animate-pulse rounded-md bg-muted" />
      <div className="h-4 w-full animate-pulse rounded-md bg-muted" />
      <div className="mt-auto space-y-2">
        <div className="h-3 w-full animate-pulse rounded-md bg-muted" />
        <div className="h-3 w-2/3 animate-pulse rounded-md bg-muted" />
      </div>
    </article>
  );
}

function EditableTextBento({
  autoFocus,
  item,
  onChange,
  onFocusReady,
}: {
  autoFocus: boolean;
  item: Extract<ProfileBentoItem, { type: "text" }>;
  onChange: (item: ProfileBentoItem) => void;
  onFocusReady?: () => void;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!autoFocus) {
      return;
    }

    const frame = requestAnimationFrame(() => {
      const textarea = textareaRef.current;

      if (!textarea) {
        return;
      }

      textarea.focus();
      textarea.setSelectionRange(textarea.value.length, textarea.value.length);
      onFocusReady?.();
    });

    return () => {
      cancelAnimationFrame(frame);
    };
  }, [autoFocus, onFocusReady]);

  return (
    <textarea
      aria-label="Text content"
      className="grid-action size-full resize-none rounded-lg bg-transparent p-1 text-lg font-medium leading-relaxed outline-none placeholder:text-muted-foreground hover:bg-secondary focus-visible:bg-secondary"
      onBlur={(event) => {
        const shouldReduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        event.currentTarget.scrollTo({
          behavior: shouldReduceMotion ? "auto" : "smooth",
          top: 0,
        });
      }}
      onChange={(event) => {
        onChange({
          ...item,
          content: { content: event.target.value },
        });
      }}
      placeholder="Write something..."
      ref={textareaRef}
      value={item.content.content}
    />
  );
}

function EditableSectionBento({
  autoFocus,
  item,
  onChange,
  onFocusReady,
}: {
  autoFocus: boolean;
  item: Extract<ProfileBentoItem, { type: "section" }>;
  onChange: (item: ProfileBentoItem) => void;
  onFocusReady?: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!autoFocus) {
      return;
    }

    const frame = requestAnimationFrame(() => {
      const input = inputRef.current;

      if (!input) {
        return;
      }

      input.focus();
      input.setSelectionRange(input.value.length, input.value.length);
      onFocusReady?.();
    });

    return () => {
      cancelAnimationFrame(frame);
    };
  }, [autoFocus, onFocusReady]);

  return (
    <span className="grid-action inline-grid h-full min-w-40 max-w-full overflow-hidden rounded-lg hover:bg-secondary focus-within:bg-secondary">
      <span
        aria-hidden
        className="invisible col-start-1 row-start-1 min-w-40 max-w-full overflow-hidden whitespace-pre font-bold text-xl tracking-tight"
      >
        {item.content.title}
      </span>
      <input
        aria-label="Section title"
        className="col-start-1 row-start-1 h-full w-full min-w-40 max-w-full bg-transparent font-bold text-xl tracking-tight outline-none placeholder:text-muted-foreground truncate"
        onChange={(event) => {
          onChange({
            ...item,
            content: { title: event.target.value },
          });
        }}
        placeholder="Add a title..."
        ref={inputRef}
        value={item.content.title}
      />
    </span>
  );
}

function MediaPreview({ item }: { item: Extract<ProfileBentoItem, { type: "media" }> }) {
  if (item.content.mediaType === "video") {
    return (
      <video
        autoPlay
        className="size-full object-cover"
        loop
        muted
        playsInline
        preload="metadata"
        src={item.content.url}
      />
    );
  }

  return (
    <Image
      alt={item.content.alt}
      className="object-cover"
      fill
      sizes="(min-width: 1024px) 25vw, 100vw"
      src={item.content.url}
    />
  );
}

function EditableMediaBento({
  item,
  onChange,
}: {
  item: Extract<ProfileBentoItem, { type: "media" }>;
  onChange: (item: ProfileBentoItem) => void;
}) {
  return (
    <article className="relative size-full overflow-hidden rounded-[1.5rem] bg-muted">
      <MediaPreview item={item} />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/70 to-transparent" />
      <input
        aria-label="Media caption"
        className="grid-action absolute bottom-3 left-3 max-w-[calc(100%-4.5rem)] rounded-md bg-black/35 px-2 py-2 font-medium text-sm text-white outline-none backdrop-blur-sm placeholder:text-white/70"
        onChange={(event) => {
          onChange({
            ...item,
            content: {
              ...item.content,
              alt: event.target.value,
              caption: event.target.value,
            },
          });
        }}
        placeholder="Caption"
        value={item.content.caption}
      />
      {item.content.href ? (
        <a
          aria-label="Open media link"
          className="grid-action absolute right-3 bottom-3 flex size-8 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm transition-colors hover:bg-black/55"
          href={item.content.href}
          rel="noreferrer"
          target="_blank"
        >
          <ArrowCircleUpRightIcon aria-hidden className="size-5" weight="bold" />
        </a>
      ) : null}
    </article>
  );
}

const toGoogleMapsUrl = (latitude: number, longitude: number) =>
  `https://www.google.com/maps?q=${latitude.toFixed(6)},${longitude.toFixed(6)}`;

const MAP_INTERACTION_OPTIONS = {
  dragRotate: false,
  keyboard: false,
  scrollZoom: false,
  touchPitch: false,
} as const;

function MapPulseMarker({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "relative flex size-8 items-center justify-center rounded-full bg-white shadow-[0_8px_24px_rgb(0_0_0_/_0.22)]",
        className
      )}
    >
      <span className="absolute size-12 rounded-full bg-blue-500 opacity-50 animate-ping [animation-duration:2.4s] -z-10" />
      <span className="relative size-[24px] rounded-full bg-blue-500 shadow-sm" />
    </span>
  );
}

function CenterMapMarker() {
  return (
    <div
      aria-hidden
      className="-translate-x-1/2 -translate-y-1/2 pointer-events-none absolute top-1/2 left-1/2 z-20"
    >
      <MapPulseMarker />
    </div>
  );
}

function MapPinMarker() {
  return <MapPulseMarker />;
}

const LEEVE_MAP_STYLE = "/assets/leeve-mapbox-inspired-carto-maplibre-style.json";
const LEEVE_MAP_STYLES = {
  light: LEEVE_MAP_STYLE,
  dark: LEEVE_MAP_STYLE,
} as const;

function EditableMapBento({
  isInteractionEnabled,
  item,
  onChange,
}: {
  isInteractionEnabled: boolean;
  item: Extract<ProfileBentoItem, { type: "map" }>;
  onChange: (item: ProfileBentoItem) => void;
}) {
  const [viewport, setViewport] = useState<MapViewport>({
    bearing: 0,
    center: [item.content.longitude, item.content.latitude],
    pitch: 0,
    zoom: item.content.zoom,
  });

  const updateLocation = useCallback(
    (nextViewport: MapViewport) => {
      const [longitude, latitude] = nextViewport.center;

      setViewport(nextViewport);
      onChange({
        ...item,
        content: {
          ...item.content,
          latitude,
          longitude,
          zoom: Math.round(nextViewport.zoom),
          url: toGoogleMapsUrl(latitude, longitude),
        },
      });
    },
    [item, onChange]
  );

  return (
    <article
      className={cn(
        "relative size-full overflow-hidden rounded-[1.5rem] border-[3px] border-transparent bg-muted transition-colors duration-200 ease-out",
        isInteractionEnabled ? "grid-action border-black" : ""
      )}
    >
      <BentoMap
        className="size-full"
        styles={LEEVE_MAP_STYLES}
        onViewportChange={updateLocation}
        viewport={viewport}
        {...MAP_INTERACTION_OPTIONS}
        dragPan={isInteractionEnabled}
        doubleClickZoom={isInteractionEnabled}
        touchZoomRotate={isInteractionEnabled}
      >
        {isInteractionEnabled ? (
          <MapControls
            position="top-right"
            showLocate
            showZoom
            onLocate={({ latitude, longitude }) => {
              updateLocation({
                ...viewport,
                center: [longitude, latitude],
                zoom: Math.max(viewport.zoom, 14),
              });
            }}
          />
        ) : null}
      </BentoMap>
      <CenterMapMarker />
      <input
        aria-label="Map caption"
        className="grid-action absolute bottom-3 left-3 max-w-[calc(100%-4.5rem)] rounded-md bg-black/35 px-2 py-2 font-medium text-sm text-white outline-none backdrop-blur-sm placeholder:text-white/70"
        onChange={(event) => {
          onChange({
            ...item,
            content: {
              ...item.content,
              caption: event.target.value,
            },
          });
        }}
        placeholder="Caption"
        value={item.content.caption}
      />
      <a
        aria-label="Open location in Google Maps"
        className="grid-action absolute right-3 bottom-3 flex size-8 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm transition-colors hover:bg-black/55"
        href={item.content.url}
        rel="noreferrer"
        target="_blank"
      >
        <ArrowCircleUpRightIcon aria-hidden className="size-5" weight="bold" />
      </a>
    </article>
  );
}

function ReadonlyMapBento({
  item,
  preventNavigation,
}: {
  item: Extract<ProfileBentoItem, { type: "map" }>;
  preventNavigation: boolean;
}) {
  return (
    <article className="relative size-full overflow-hidden rounded-[1.5rem] border-[3px] border-transparent bg-muted transition-colors duration-200 ease-out">
      <BentoMap
        className="size-full"
        styles={LEEVE_MAP_STYLES}
        viewport={{
          center: [item.content.longitude, item.content.latitude],
          zoom: item.content.zoom,
        }}
        {...MAP_INTERACTION_OPTIONS}
        dragPan={false}
        doubleClickZoom={false}
        touchZoomRotate={false}
      >
        <MapMarker latitude={item.content.latitude} longitude={item.content.longitude}>
          <MarkerContent className="pointer-events-none">
            <MapPinMarker />
          </MarkerContent>
        </MapMarker>
      </BentoMap>
      {item.content.caption ? (
        <p className="pointer-events-none absolute bottom-3 left-3 line-clamp-2 max-w-[calc(100%-4.5rem)] rounded-md bg-black/25 px-2 py-1 font-medium text-sm text-white backdrop-blur-sm">
          {item.content.caption}
        </p>
      ) : null}
      <a
        aria-label="Open location in Google Maps"
        className="absolute right-3 bottom-3 flex size-8 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm transition-colors hover:bg-black/55"
        href={item.content.url}
        onClick={preventNavigation ? (event) => event.preventDefault() : undefined}
        rel="noreferrer"
        target="_blank"
      >
        <ArrowCircleUpRightIcon aria-hidden className="size-5" weight="bold" />
      </a>
    </article>
  );
}

export function ProfileBentoGridCard({
  activeBreakpoint,
  item,
  layoutSize,
  preventNavigation = false,
}: {
  activeBreakpoint?: GridBreakpoint;
  item: ProfileBentoItem;
  layoutSize?: ProfileBentoLinkSize;
  preventNavigation?: boolean;
}) {
  return (
    <ProfileBentoGridCardContent
      activeBreakpoint={activeBreakpoint}
      item={item}
      layoutSize={layoutSize}
      preventNavigation={preventNavigation}
    />
  );
}

function ProfileBentoGridCardContent({
  activeBreakpoint = "desktop",
  item,
  layoutSize,
  preventNavigation = false,
}: {
  activeBreakpoint?: GridBreakpoint;
  item: ProfileBentoItem;
  layoutSize?: ProfileBentoLinkSize;
  preventNavigation?: boolean;
}) {
  if (item.type === "link") {
    const activeLayout = item.layout[activeBreakpoint];
    const size = layoutSize ?? getProfileBentoLinkSize(activeLayout.w, activeLayout.h);

    return (
      <a
        className="relative block size-full min-h-0 overflow-hidden rounded-lg"
        href={item.content.url}
        onClick={preventNavigation ? (event) => event.preventDefault() : undefined}
        rel="noreferrer"
        target="_blank"
      >
        <ReadonlyLinkBento item={item} layoutSize={size} />
      </a>
    );
  }

  if (item.type === "text") {
    return <ReadonlyTextBento content={item.content.content} />;
  }

  if (item.type === "playlist") {
    return (
      <article className="relative size-full overflow-hidden rounded-lg">
        <PlaylistIframe content={item.content.content} title={item.content.title} />
      </article>
    );
  }

  if (item.type === "media") {
    const hasBottomOverlay = Boolean(item.content.caption || item.content.href);

    return (
      <article className="relative size-full overflow-hidden rounded-[1.5rem] bg-muted">
        <MediaPreview item={item} />
        {hasBottomOverlay ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/70 to-transparent" />
        ) : null}
        {item.content.caption ? (
          <p className="pointer-events-none absolute bottom-3 left-3 line-clamp-2 max-w-[calc(100%-4.5rem)] rounded-md bg-black/25 px-2 py-1 font-medium text-sm text-white backdrop-blur-sm">
            {item.content.caption}
          </p>
        ) : null}
        {item.content.href ? (
          <a
            aria-label="Open media link"
            className="absolute right-3 bottom-3 flex size-8 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm transition-colors hover:bg-black/55"
            href={item.content.href}
            onClick={preventNavigation ? (event) => event.preventDefault() : undefined}
            rel="noreferrer"
            target="_blank"
          >
            <ArrowCircleUpRightIcon aria-hidden className="size-5" weight="bold" />
          </a>
        ) : null}
      </article>
    );
  }

  if (item.type === "map") {
    return <ReadonlyMapBento item={item} preventNavigation={preventNavigation} />;
  }

  return (
    <section className="relative inline-grid h-full min-w-40 max-w-full overflow-hidden rounded-lg">
      <h2 className="h-full w-full min-w-40 max-w-full truncate font-bold text-xl tracking-tight">
        {item.content.title}
      </h2>
    </section>
  );
}

function ReadonlyTextBento({ content }: { content: string }) {
  return (
    <article className="relative size-full min-h-0 overflow-y-auto overscroll-contain rounded-lg p-1">
      <p className="whitespace-pre-line break-words text-lg font-medium leading-relaxed">
        {content}
      </p>
    </article>
  );
}
