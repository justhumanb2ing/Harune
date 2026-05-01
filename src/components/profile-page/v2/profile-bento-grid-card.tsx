import { ArrowCircleUpRightIcon } from "@phosphor-icons/react";
import Image from "next/image";
import type { CSSProperties } from "react";
import { useEffect, useRef } from "react";
import { PlaylistIframe } from "@/components/profile-page/playlist-iframe";
import type { GridBreakpoint, ResizeOptionId } from "@/lib/grid/grid-types";
import type { ProfileBentoItem } from "@/lib/profile-page/types";
import { cn } from "@/lib/utils";

type ProfileBentoLinkSize = ResizeOptionId;

export function ProfileBentoEditableGridCard({ item }: { item: ProfileBentoItem }) {
  return <ProfileBentoGridCardContent item={item} preventNavigation />;
}

export function ProfileBentoEditableContentCard({
  autoFocus = false,
  activeBreakpoint = "desktop",
  isLoading = false,
  item,
  layoutSize,
  onChange,
  onFocusReady,
}: {
  autoFocus?: boolean;
  activeBreakpoint?: GridBreakpoint;
  isLoading?: boolean;
  item: ProfileBentoItem;
  layoutSize?: ProfileBentoLinkSize;
  onChange: (item: ProfileBentoItem) => void;
  onFocusReady?: () => void;
}) {
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

  return <ProfileBentoEditableGridCard item={item} />;
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
    <div className="min-w-0 max-w-full px-2 text-muted-foreground text-xs">
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
      <article className="flex size-full min-h-0 items-center gap-3 overflow-hidden rounded-lg p-3">
        <LinkFavicon favicon={item.content.favicon} title={item.content.title} />
        <ReadonlyLinkTitle title={item.content.title} className="flex-1" />
      </article>
    );
  }

  if (layoutSize === "2x2") {
    return (
      <article className="flex size-full min-h-0 gap-3 overflow-hidden rounded-lg p-3">
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
      <article className="flex size-full min-h-0 flex-col justify-between gap-3 overflow-hidden rounded-lg p-3">
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
      <article className="flex size-full min-h-0 flex-col justify-between gap-3 overflow-hidden rounded-lg p-3">
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
    <article className="flex size-full min-h-0 flex-col gap-3 overflow-hidden rounded-lg p-3">
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
      <article className="flex size-full min-h-0 items-center gap-3 overflow-hidden rounded-lg p-3">
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
      <article className="flex size-full min-h-0 gap-3 overflow-hidden rounded-lg p-3">
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
      <article className="flex size-full min-h-0 flex-col justify-between gap-3 overflow-hidden rounded-lg p-3">
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
      <article className="flex size-full min-h-0 flex-col justify-between gap-3 overflow-hidden rounded-lg p-3">
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
    <article className="flex size-full min-h-0 flex-col gap-3 overflow-hidden rounded-lg p-3">
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
      className="grid-action size-full resize-none rounded-lg bg-transparent p-3 py-1 text-lg font-medium leading-relaxed outline-none placeholder:text-muted-foreground hover:bg-secondary focus-visible:bg-secondary"
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
    <article className="relative size-full overflow-hidden rounded-xl bg-muted">
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

export function ProfileBentoGridCard({
  activeBreakpoint,
  item,
  layoutSize,
}: {
  activeBreakpoint?: GridBreakpoint;
  item: ProfileBentoItem;
  layoutSize?: ProfileBentoLinkSize;
}) {
  return (
    <ProfileBentoGridCardContent
      activeBreakpoint={activeBreakpoint}
      item={item}
      layoutSize={layoutSize}
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
    return (
      <article className="relative size-full overflow-hidden rounded-xl bg-muted">
        <MediaPreview item={item} />
        {item.content.caption ? (
          <>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/70 to-transparent" />
            <p className="pointer-events-none absolute bottom-3 left-3 line-clamp-2 max-w-[calc(100%-4.5rem)] rounded-md bg-black/25 px-2 py-1 font-medium text-sm text-white backdrop-blur-sm">
              {item.content.caption}
            </p>
          </>
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

  return (
    <section className="relative flex size-full items-center rounded-lg">
      <h2 className="truncate font-bold text-xl tracking-tight">{item.content.title}</h2>
    </section>
  );
}

function ReadonlyTextBento({ content }: { content: string }) {
  const containerRef = useRef<HTMLElement>(null);
  const textRef = useRef<HTMLParagraphElement>(null);
  const lineClampRef = useRef(1);

  useEffect(() => {
    const container = containerRef.current;
    const text = textRef.current;

    if (!container || !text) {
      return;
    }

    const updateLineClamp = () => {
      const containerStyle = window.getComputedStyle(container);
      const textStyle = window.getComputedStyle(text);
      const availableHeight =
        container.clientHeight -
        Number.parseFloat(containerStyle.paddingTop) -
        Number.parseFloat(containerStyle.paddingBottom);
      const lineHeight = Number.parseFloat(textStyle.lineHeight);
      const nextLineClamp = Math.max(1, Math.floor(availableHeight / lineHeight));

      if (lineClampRef.current === nextLineClamp) {
        return;
      }

      lineClampRef.current = nextLineClamp;
      text.style.webkitLineClamp = String(nextLineClamp);
    };

    updateLineClamp();

    const observer = new ResizeObserver(updateLineClamp);
    observer.observe(container);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <article className="relative size-full overflow-hidden rounded-lg p-3 py-1" ref={containerRef}>
      <p
        className="overflow-hidden whitespace-pre-line break-words text-lg font-medium leading-relaxed"
        ref={textRef}
        style={
          {
            WebkitBoxOrient: "vertical",
            WebkitLineClamp: lineClampRef.current,
            display: "-webkit-box",
          } as CSSProperties
        }
      >
        {content}
      </p>
    </article>
  );
}
