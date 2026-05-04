import { ArrowCircleUpRightIcon } from "@phosphor-icons/react";
import Image from "next/image";
import { type CSSProperties, memo, useCallback, useEffect, useRef, useState } from "react";
import { PlaylistIframe } from "@/components/profile/playlist-iframe";
import {
  Map as BentoMap,
  MapControls,
  MapMarker,
  type MapViewport,
  MarkerContent,
} from "@/components/ui/map";
import type { GridBreakpoint, ResizeOptionId } from "@/lib/grid/grid-types";
import { resolveLinkProviderTheme } from "@/lib/metadata/link-provider-theme";
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
  const hasFavicon = !!favicon;

  return (
    <span
      className={cn(
        "flex size-full shrink-0 items-center justify-center overflow-hidden rounded-lg",
        hasFavicon ? "bg-transparent" : "bg-muted/60",
        className
      )}
    >
      {hasFavicon ? (
        <Image
          alt=""
          className="pointer-events-none size-full object-cover select-none"
          height={32}
          src={favicon}
          unoptimized
          width={32}
        />
      ) : (
        <span className="size-full bg-muted/40" aria-hidden />
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
      className="grid-action inline-flex size-9 md:size-10 shrink-0 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
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
        "grid-action min-h-9 min-w-0 rounded-md bg-transparent px-0 py-1.5 font-medium text-base outline-none transition-colors placeholder:text-muted-foreground hover:bg-secondary focus-visible:bg-secondary truncate",
        "group-data-[link-provider-theme=true]/item:placeholder:text-[var(--grid-card-muted-foreground)] group-data-[link-provider-theme=true]/item:hover:bg-[var(--grid-card-control-background)] group-data-[link-provider-theme=true]/item:focus-visible:bg-[var(--grid-card-control-background)]",
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
        "min-h-9 min-w-0 truncate rounded-md px-0 py-1.5 font-medium text-base",
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

function ReadonlyLinkFavicon({
  favicon,
  href,
  title,
  preventNavigation,
}: {
  favicon: string | null;
  href: string;
  title: string;
  preventNavigation: boolean;
}) {
  return (
    <a
      aria-label={title ? `Open ${title}` : "Open link"}
      className="grid-action inline-flex size-9 shrink-0 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50 md:size-10"
      href={href}
      onClick={preventNavigation ? (event) => event.preventDefault() : undefined}
      rel="noreferrer"
      target="_blank"
    >
      <LinkFavicon favicon={favicon} title={title} />
    </a>
  );
}

function ReadonlyLinkAction({
  backgroundColor,
  foregroundColor,
  href,
  label,
  preventNavigation,
}: {
  backgroundColor: string;
  foregroundColor: string;
  href: string;
  label: string;
  preventNavigation: boolean;
}) {
  return (
    <a
      aria-label={label}
      className={cn(
        "grid-action outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-ring/50 !bg-[var(--link-provider-action-background)] !text-[var(--link-provider-action-foreground)]",
        LINK_PROVIDER_ACTION_LABEL_CLASS_NAME
      )}
      href={href}
      onClick={preventNavigation ? (event) => event.preventDefault() : undefined}
      rel="noreferrer"
      style={
        {
          "--link-provider-action-background": backgroundColor,
          "--link-provider-action-foreground": foregroundColor,
        } as CSSProperties
      }
      target="_blank"
    >
      {label}
    </a>
  );
}

const LINK_PROVIDER_ACTION_LABEL_CLASS_NAME =
  "inline-flex h-6 max-w-fit shrink-0 items-center justify-center truncate rounded-full px-4 py-4 font-semibold text-sm leading-none sm:h-8 sm:px-4 sm:text-sm md:px-4 md:py-4.5";

function EditableLinkProviderAction({
  backgroundColor,
  foregroundColor,
  href,
  label,
}: {
  backgroundColor: string;
  foregroundColor: string;
  href: string;
  label: string;
}) {
  return (
    <a
      aria-label={label}
      className={cn(
        "grid-action outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-ring/50 !bg-[var(--link-provider-action-background)] !text-[var(--link-provider-action-foreground)]",
        LINK_PROVIDER_ACTION_LABEL_CLASS_NAME
      )}
      href={href}
      rel="noreferrer"
      style={
        {
          "--link-provider-action-background": backgroundColor,
          "--link-provider-action-foreground": foregroundColor,
        } as CSSProperties
      }
      target="_blank"
    >
      {label}
    </a>
  );
}

function LinkThumbnail({ thumbnail, className }: { thumbnail: string | null; className?: string }) {
  const hasThumbnail = !!thumbnail;

  return (
    <div
      className={cn(
        "pointer-events-none relative overflow-hidden rounded-md select-none",
        hasThumbnail ? "bg-muted" : "bg-muted/60",
        className
      )}
      aria-hidden
    >
      {hasThumbnail ? (
        <Image
          alt=""
          className="pointer-events-none object-cover select-none"
          fill
          sizes="(min-width: 1024px) 25vw, 50vw"
          src={thumbnail}
        />
      ) : null}
    </div>
  );
}

function ReadonlyLinkBento({
  item,
  layoutSize,
  preventNavigation,
}: {
  item: Extract<ProfileBentoItem, { type: "link" }>;
  layoutSize: ProfileBentoLinkSize;
  preventNavigation: boolean;
}) {
  const providerTheme = resolveLinkProviderTheme(item.content.url);

  if (layoutSize === "2x1") {
    return (
      <article className="flex size-full min-h-0 items-center gap-3 overflow-hidden rounded-lg p-2">
        <ReadonlyLinkFavicon
          favicon={item.content.favicon}
          href={item.content.url}
          preventNavigation={preventNavigation}
          title={item.content.title}
        />
        <ReadonlyLinkTitle title={item.content.title} className="flex-1" />
        {providerTheme ? (
          <ReadonlyLinkAction
            backgroundColor={providerTheme.actionBackgroundColor}
            foregroundColor={providerTheme.actionForegroundColor}
            href={item.content.url}
            label={providerTheme.actionLabel}
            preventNavigation={preventNavigation}
          />
        ) : null}
      </article>
    );
  }

  if (layoutSize === "2x2") {
    return (
      <article className="flex size-full min-h-0 gap-3 overflow-hidden rounded-lg p-2">
        <div className="flex min-w-0 flex-1 flex-col justify-between">
          <div className="flex min-w-0 flex-1 flex-col gap-3">
            <ReadonlyLinkFavicon
              favicon={item.content.favicon}
              href={item.content.url}
              preventNavigation={preventNavigation}
              title={item.content.title}
            />
            <ReadonlyLinkTitle title={item.content.title} className="w-full" />
          </div>
          {providerTheme ? (
            <ReadonlyLinkAction
              backgroundColor={providerTheme.actionBackgroundColor}
              foregroundColor={providerTheme.actionForegroundColor}
              href={item.content.url}
              label={providerTheme.actionLabel}
              preventNavigation={preventNavigation}
            />
          ) : null}
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
            <ReadonlyLinkFavicon
              favicon={item.content.favicon}
              href={item.content.url}
              preventNavigation={preventNavigation}
              title={item.content.title}
            />
            <ReadonlyLinkTitle title={item.content.title} className="w-full" />
          </div>
          {providerTheme ? (
            <ReadonlyLinkAction
              backgroundColor={providerTheme.actionBackgroundColor}
              foregroundColor={providerTheme.actionForegroundColor}
              href={item.content.url}
              label={providerTheme.actionLabel}
              preventNavigation={preventNavigation}
            />
          ) : null}
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
            <ReadonlyLinkFavicon
              favicon={item.content.favicon}
              href={item.content.url}
              preventNavigation={preventNavigation}
              title={item.content.title}
            />
            <ReadonlyLinkTitle title={item.content.title} className="w-full" />
          </div>
          {providerTheme ? (
            <ReadonlyLinkAction
              backgroundColor={providerTheme.actionBackgroundColor}
              foregroundColor={providerTheme.actionForegroundColor}
              href={item.content.url}
              label={providerTheme.actionLabel}
              preventNavigation={preventNavigation}
            />
          ) : null}
        </div>
        <LinkThumbnail thumbnail={item.content.thumbnail} className="h-[42%] w-full shrink-0" />
      </article>
    );
  }

  return (
    <article className="flex size-full min-h-0 flex-col justify-between gap-3 overflow-hidden rounded-lg p-2">
      <div className="flex min-w-0 flex-col gap-3">
        <ReadonlyLinkFavicon
          favicon={item.content.favicon}
          href={item.content.url}
          preventNavigation={preventNavigation}
          title={item.content.title}
        />
        <ReadonlyLinkTitle title={item.content.title} className="w-full" />
      </div>
      {providerTheme ? (
        <ReadonlyLinkAction
          backgroundColor={providerTheme.actionBackgroundColor}
          foregroundColor={providerTheme.actionForegroundColor}
          href={item.content.url}
          label={providerTheme.actionLabel}
          preventNavigation={preventNavigation}
        />
      ) : null}
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
  const providerTheme = resolveLinkProviderTheme(item.content.url);

  if (size === "2x1") {
    return (
      <article className="flex size-full min-h-0 items-center gap-3 overflow-hidden rounded-lg p-2">
        <EditableLinkFavicon
          favicon={item.content.favicon}
          href={item.content.url}
          title={item.content.title}
        />
        <LinkTitleInput item={item} onChange={onChange} className="flex-1" />
        {providerTheme ? (
          <EditableLinkProviderAction
            backgroundColor={providerTheme.actionBackgroundColor}
            foregroundColor={providerTheme.actionForegroundColor}
            href={item.content.url}
            label={providerTheme.actionLabel}
          />
        ) : null}
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
          {providerTheme ? (
            <EditableLinkProviderAction
              backgroundColor={providerTheme.actionBackgroundColor}
              foregroundColor={providerTheme.actionForegroundColor}
              href={item.content.url}
              label={providerTheme.actionLabel}
            />
          ) : null}
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
          {providerTheme ? (
            <EditableLinkProviderAction
              backgroundColor={providerTheme.actionBackgroundColor}
              foregroundColor={providerTheme.actionForegroundColor}
              href={item.content.url}
              label={providerTheme.actionLabel}
            />
          ) : null}
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
          {providerTheme ? (
            <EditableLinkProviderAction
              backgroundColor={providerTheme.actionBackgroundColor}
              foregroundColor={providerTheme.actionForegroundColor}
              href={item.content.url}
              label={providerTheme.actionLabel}
            />
          ) : null}
        </div>
        <LinkThumbnail thumbnail={item.content.thumbnail} className="h-[42%] w-full shrink-0" />
      </article>
    );
  }

  return (
    <article className="flex size-full min-h-0 flex-col justify-between gap-3 overflow-hidden rounded-lg p-2">
      <div className="flex min-w-0 flex-col gap-3">
        <EditableLinkFavicon
          favicon={item.content.favicon}
          href={item.content.url}
          title={item.content.title}
        />
        <LinkTitleInput item={item} onChange={onChange} className="w-full" />
      </div>
      {providerTheme ? (
        <EditableLinkProviderAction
          backgroundColor={providerTheme.actionBackgroundColor}
          foregroundColor={providerTheme.actionForegroundColor}
          href={item.content.url}
          label={providerTheme.actionLabel}
        />
      ) : null}
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

      textarea.focus({ preventScroll: true });
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
      className="grid-action size-full resize-none rounded-lg bg-transparent p-1 text-lg! font-medium leading-relaxed outline-none break-all placeholder:text-muted-foreground hover:bg-secondary focus-visible:bg-secondary"
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

      input.focus({ preventScroll: true });
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
        className="col-start-1 row-start-1 h-full w-full min-w-40 max-w-full truncate bg-transparent px-2 font-bold text-xl tracking-tight outline-none placeholder:text-muted-foreground"
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
          className={cn("grid-action", overlayActionLinkClassName)}
          href={item.content.href}
          rel="noreferrer"
          target="_blank"
        >
          <ArrowCircleUpRightIcon aria-hidden className="size-7" weight="fill" />
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

const overlayActionLinkClassName =
  "absolute right-3 bottom-4 flex size-7 items-center justify-center rounded-full bg-white text-black shadow-md backdrop-blur-sm transition-colors hover:bg-white/60";

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
        "relative size-full overflow-hidden rounded-[1.5rem] ring-0 border-transparent bg-muted transition-all duration-200 ease-out",
        isInteractionEnabled ? "grid-action ring-4 ring-black" : ""
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
        className={cn("grid-action", overlayActionLinkClassName)}
        href={item.content.url}
        rel="noreferrer"
        target="_blank"
      >
        <ArrowCircleUpRightIcon aria-hidden className="size-7" weight="fill" />
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
    <article className="relative size-full overflow-hidden rounded-[1.5rem] bg-muted transition-colors duration-200 ease-out">
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
        className={overlayActionLinkClassName}
        href={item.content.url}
        onClick={preventNavigation ? (event) => event.preventDefault() : undefined}
        rel="noreferrer"
        target="_blank"
      >
        <ArrowCircleUpRightIcon aria-hidden className="size-7" weight="fill" />
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
      <ReadonlyLinkBento item={item} layoutSize={size} preventNavigation={preventNavigation} />
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
          <p className="min-w-0 truncate pointer-events-none absolute bottom-3 left-3 line-clamp-2 max-w-[calc(100%-4.5rem)] rounded-md bg-black/25 px-2 py-1 font-medium text-sm text-white backdrop-blur-sm">
            {item.content.caption}
          </p>
        ) : null}
        {item.content.href ? (
          <a
            aria-label="Open media link"
            className={overlayActionLinkClassName}
            href={item.content.href}
            onClick={preventNavigation ? (event) => event.preventDefault() : undefined}
            rel="noreferrer"
            target="_blank"
          >
            <ArrowCircleUpRightIcon aria-hidden className="size-7" weight="fill" />
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
      <h2 className="h-full w-full min-w-40 max-w-full truncate px-2 font-bold text-xl tracking-tight">
        {item.content.title}
      </h2>
    </section>
  );
}

function ReadonlyTextBento({ content }: { content: string }) {
  return (
    <article className="relative size-full min-h-0 overflow-y-auto overscroll-contain rounded-lg p-1">
      <p className="whitespace-pre-line break-all text-lg! font-medium leading-relaxed">
        {content}
      </p>
    </article>
  );
}
