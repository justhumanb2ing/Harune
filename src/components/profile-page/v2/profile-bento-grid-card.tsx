import Image from "next/image";
import type { CSSProperties } from "react";
import { useEffect, useRef } from "react";
import { PlaylistIframe } from "@/components/profile-page/playlist-iframe";
import type { ProfileBentoItem } from "@/lib/profile-page/types";

export function ProfileBentoEditableGridCard({ item }: { item: ProfileBentoItem }) {
  return <ProfileBentoGridCardContent item={item} preventNavigation />;
}

export function ProfileBentoEditableContentCard({
  autoFocus = false,
  item,
  onChange,
  onFocusReady,
}: {
  autoFocus?: boolean;
  item: ProfileBentoItem;
  onChange: (item: ProfileBentoItem) => void;
  onFocusReady?: () => void;
}) {
  if (item.type === "link") {
    return (
      <article className="grid-action flex size-full min-h-0 flex-col gap-2 overflow-hidden rounded-lg p-3">
        <input
          aria-label="Link title"
          className="w-full bg-transparent font-medium text-sm outline-none placeholder:text-muted-foreground"
          onChange={(event) => {
            onChange({
              ...item,
              content: { ...item.content, title: event.target.value },
            });
          }}
          placeholder="Link title"
          value={item.content.title}
        />
        <input
          aria-label="Link URL"
          className="w-full bg-transparent text-muted-foreground text-xs outline-none placeholder:text-muted-foreground"
          onChange={(event) => {
            onChange({
              ...item,
              content: { ...item.content, url: event.target.value },
            });
          }}
          placeholder="https://example.com"
          value={item.content.url}
        />
        <textarea
          aria-label="Link description"
          className="min-h-0 flex-1 resize-none bg-transparent text-sm leading-6 outline-none placeholder:text-muted-foreground"
          onChange={(event) => {
            onChange({
              ...item,
              content: { ...item.content, description: event.target.value },
            });
          }}
          placeholder="Description"
          value={item.content.description ?? ""}
        />
      </article>
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

  return <ProfileBentoEditableGridCard item={item} />;
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
      className="grid-action size-full resize-none rounded-lg bg-transparent p-3 text-lg font-medium leading-relaxed outline-none placeholder:text-muted-foreground hover:bg-secondary focus-visible:bg-secondary"
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
    <input
      aria-label="Section title"
      className="grid-action size-full rounded-lg px-4 font-bold text-xl tracking-tight outline-none placeholder:text-muted-foreground hover:bg-secondary focus-visible:bg-secondary"
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
  );
}

export function ProfileBentoGridCard({ item }: { item: ProfileBentoItem }) {
  return <ProfileBentoGridCardContent item={item} />;
}

function ProfileBentoGridCardContent({
  item,
  preventNavigation = false,
}: {
  item: ProfileBentoItem;
  preventNavigation?: boolean;
}) {
  if (item.type === "link") {
    return (
      <a
        className="relative flex size-full min-h-0 flex-col overflow-hidden rounded-lg transition-colors hover:bg-muted/40"
        href={item.content.url}
        onClick={preventNavigation ? (event) => event.preventDefault() : undefined}
        rel="noreferrer"
        target="_blank"
      >
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
    return <ReadonlyTextBento content={item.content.content} />;
  }

  if (item.type === "playlist") {
    return (
      <article className="relative size-full overflow-hidden rounded-lg">
        <PlaylistIframe content={item.content.content} title={item.content.title} />
      </article>
    );
  }

  return (
    <section className="relative flex size-full items-center rounded-lg bg-muted px-4">
      <h2 className="font-semibold text-lg tracking-tight">{item.content.title}</h2>
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
    <article className="relative size-full overflow-hidden rounded-lg p-4" ref={containerRef}>
      <p
        className="overflow-hidden whitespace-pre-line break-words text-sm leading-6"
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
