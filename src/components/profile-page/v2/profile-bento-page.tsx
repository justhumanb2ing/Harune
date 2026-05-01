import { PlaylistIframe } from "@/components/profile-page/playlist-iframe";
import { COLS } from "@/lib/grid/grid-config";
import type {
  ProfileBentoBreakpoint,
  ProfileBentoItem,
  ProfileBentoLayout,
  PublicProfileBentoPageData,
} from "@/lib/profile-page/types";
import { cn } from "@/lib/utils";

type ProfileBentoPageProps = PublicProfileBentoPageData;

const orderedBento = (bento: ProfileBentoItem[], breakpoint: ProfileBentoBreakpoint) => {
  return [...bento].sort((a, b) => {
    const aLayout = a.layout[breakpoint];
    const bLayout = b.layout[breakpoint];

    return aLayout.y - bLayout.y || aLayout.x - bLayout.x;
  });
};

const getGridItemStyle = (layout: ProfileBentoLayout) => ({
  gridColumn: `${layout.x + 1} / span ${layout.w}`,
  gridRow: `${layout.y + 1} / span ${layout.h}`,
});

function ProfileBentoCard({ item }: { item: ProfileBentoItem }) {
  if (item.type === "link") {
    return (
      <a
        className="flex size-full min-h-0 flex-col overflow-hidden rounded-lg border border-border bg-background shadow-sm transition-colors hover:bg-muted/40"
        href={item.content.url}
        rel="noreferrer"
        target="_blank"
      >
        {item.content.thumbnail ? (
          <img alt="" className="h-24 w-full shrink-0 object-cover" src={item.content.thumbnail} />
        ) : null}
        <div className="flex min-h-0 flex-1 flex-col gap-2 p-4">
          <div className="flex min-w-0 items-center gap-2">
            {item.content.favicon ? (
              <img alt="" className="size-5 shrink-0 rounded-sm" src={item.content.favicon} />
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
      <article className="size-full overflow-hidden rounded-lg border border-border bg-background p-4 shadow-sm">
        <p className="whitespace-pre-line break-words text-sm leading-6">{item.content.content}</p>
      </article>
    );
  }

  if (item.type === "playlist") {
    return (
      <article className="size-full overflow-hidden rounded-lg border border-border bg-background shadow-sm">
        <PlaylistIframe content={item.content.content} title={item.content.title} />
      </article>
    );
  }

  return (
    <section className="flex size-full items-center rounded-lg bg-muted px-4">
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

export function ProfileBentoPage({ page, bento }: ProfileBentoPageProps) {
  const displayName = page.name ?? page.userName ?? page.handle;

  return (
    <section className="mx-auto min-h-lvh w-full max-w-5xl px-4 py-8">
      <header className="mb-8 flex flex-col gap-5">
        {page.backgroundImage ? (
          <img alt="" className="h-44 w-full rounded-lg object-cover" src={page.backgroundImage} />
        ) : null}
        <div className="flex items-center gap-4">
          {page.image ? (
            <img alt={displayName} className="size-20 rounded-full object-cover" src={page.image} />
          ) : null}
          <div className="min-w-0">
            <h1 className="truncate font-semibold text-3xl tracking-tight">{displayName}</h1>
            {page.role || page.location ? (
              <p className="mt-1 text-muted-foreground text-sm">
                {[page.role, page.location].filter(Boolean).join(" / ")}
              </p>
            ) : null}
          </div>
        </div>
        {page.bio ? (
          <p className="max-w-2xl whitespace-pre-line text-muted-foreground text-sm leading-6">
            {page.bio}
          </p>
        ) : null}
      </header>

      <BentoGrid bento={bento} breakpoint="compact" className="lg:hidden" />
      <BentoGrid bento={bento} breakpoint="desktop" className="hidden lg:grid" />
    </section>
  );
}
