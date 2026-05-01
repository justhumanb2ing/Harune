"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import type { LayoutItem } from "react-grid-layout";
import { PlaylistIframe } from "@/components/profile-page/playlist-iframe";
import { Button } from "@/components/ui/button";
import { COLS } from "@/lib/grid/grid-config";
import { createLayoutItem } from "@/lib/grid/grid-layout-utils";
import type {
  ProfileBentoBreakpoint,
  ProfileBentoItem,
  ProfileBentoLayout,
  ProfileBentoType,
} from "@/lib/profile-page/types";
import { cn } from "@/lib/utils";

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

const orderedBento = (bento: ProfileBentoItem[], breakpoint: ProfileBentoBreakpoint) => {
  return [...bento].sort((a, b) => {
    const aLayout = a.layout[breakpoint];
    const bLayout = b.layout[breakpoint];

    return aLayout.y - bLayout.y || aLayout.x - bLayout.x;
  });
};

const toLayoutItems = (
  bento: ProfileBentoItem[],
  breakpoint: ProfileBentoBreakpoint
): LayoutItem[] =>
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

const getGridItemStyle = (layout: ProfileBentoLayout) => ({
  gridColumn: `${layout.x + 1} / span ${layout.w}`,
  gridRow: `${layout.y + 1} / span ${layout.h}`,
});

const layoutLabel = (item: ProfileBentoItem) =>
  `D ${item.layout.desktop.x},${item.layout.desktop.y},${item.layout.desktop.w}x${item.layout.desktop.h} / C ${item.layout.compact.x},${item.layout.compact.y},${item.layout.compact.w}x${item.layout.compact.h}`;

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

function LayoutBadge({ item }: { item: ProfileBentoItem }) {
  return (
    <span className="pointer-events-none absolute top-2 right-2 rounded-full bg-background/90 px-2 py-1 font-mono text-[10px] text-muted-foreground shadow-sm">
      {layoutLabel(item)}
    </span>
  );
}

function ProfileBentoCard({ item }: { item: ProfileBentoItem }) {
  if (item.type === "link") {
    return (
      <a
        className="relative flex size-full min-h-0 flex-col overflow-hidden rounded-lg border border-border bg-background shadow-sm transition-colors hover:bg-muted/40"
        href={item.content.url}
        rel="noreferrer"
        target="_blank"
      >
        <LayoutBadge item={item} />
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
      <article className="relative size-full overflow-hidden rounded-lg border border-border bg-background p-4 shadow-sm">
        <LayoutBadge item={item} />
        <p className="whitespace-pre-line break-words text-sm leading-6">{item.content.content}</p>
      </article>
    );
  }

  if (item.type === "playlist") {
    return (
      <article className="relative size-full overflow-hidden rounded-lg border border-border bg-background shadow-sm">
        <LayoutBadge item={item} />
        <PlaylistIframe content={item.content.content} title={item.content.title} />
      </article>
    );
  }

  return (
    <section className="relative flex size-full items-center rounded-lg bg-muted px-4">
      <LayoutBadge item={item} />
      <h2 className="font-semibold text-lg tracking-tight">{item.content.title}</h2>
    </section>
  );
}

function BentoGrid({
  bento,
  breakpoint,
  className,
}: {
  bento: ProfileBentoItem[];
  breakpoint: ProfileBentoBreakpoint;
  className?: string;
}) {
  return (
    <div
      className={cn("grid auto-rows-[72px] gap-4 lg:auto-rows-[80px]", className)}
      style={{
        gridTemplateColumns: `repeat(${COLS[breakpoint]}, minmax(0, 1fr))`,
      }}
    >
      {orderedBento(bento, breakpoint).map((item) => (
        <div key={item.id} style={getGridItemStyle(item.layout[breakpoint])}>
          <ProfileBentoCard item={item} />
        </div>
      ))}
    </div>
  );
}

export function ProfileBentoGridPlayground({ initialBento }: ProfileBentoGridPlaygroundProps) {
  const [bento, setBento] = useState(initialBento);
  const bentoCountLabel = useMemo(() => `${bento.length} items`, [bento.length]);

  const addItem = (type: CreatableBentoType) => {
    setBento((currentItems) => [...currentItems, createAutoBentoItem(type, currentItems)]);
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

      <BentoGrid bento={bento} breakpoint="compact" className="lg:hidden" />
      <BentoGrid bento={bento} breakpoint="desktop" className="hidden lg:grid" />
    </section>
  );
}
