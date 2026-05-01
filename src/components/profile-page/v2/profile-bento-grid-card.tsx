import Image from "next/image";
import { PlaylistIframe } from "@/components/profile-page/playlist-iframe";
import type { GridLayouts } from "@/lib/grid/grid-types";
import type { ProfileBentoItem } from "@/lib/profile-page/types";
import { getBentoLayoutLabel, mergeLayoutsIntoBento } from "./profile-bento-grid-model";

function LayoutBadge({ item, layouts }: { item: ProfileBentoItem; layouts: GridLayouts }) {
  const liveItem = mergeLayoutsIntoBento([item], layouts)[0] ?? item;

  return (
    <span className="pointer-events-none absolute top-2 right-2 rounded-full bg-background/90 px-2 py-1 font-mono text-[10px] text-muted-foreground shadow-sm">
      {getBentoLayoutLabel(liveItem)}
    </span>
  );
}

export function ProfileBentoGridCard({
  item,
  layouts,
}: {
  item: ProfileBentoItem;
  layouts: GridLayouts;
}) {
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
