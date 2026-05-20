import { ArrowCircleUpRightIcon } from "@phosphor-icons/react";
import Image from "next/image";
import {
  type CSSProperties,
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { getBackgroundColorOption } from "@/components/grid/grid-text-surface";
import { useGridTextSurface } from "@/components/grid/grid-text-surface-context";
import { SpotifyEmbedPanel } from "@/components/profile/v2/spotify-embed-panel";
import {
  Map as BentoMap,
  MapControls,
  MapMarker,
  type MapViewport,
  MarkerContent,
} from "@/components/ui/map";
import { SlidingNumber } from "@/components/ui/sliding-number";
import { Textarea } from "@/components/ui/textarea";
import type { GridBreakpoint, ResizeOptionId } from "@/lib/grid/grid-types";
import {
  type LinkProviderTheme,
  resolveLinkProviderTheme,
} from "@/lib/metadata/link-provider-theme";
import {
  formatCompactCount,
  getSpotifyProviderEmbedUri,
  getYoutubeThumbnailUrl,
  isChzzkProviderMetadata,
  isDiscordProviderMetadata,
  isGithubContributionsProviderMetadata,
  isTwitchProviderMetadata,
  isYoutubeProviderMetadata,
  type NormalizedMetadata,
} from "@/lib/metadata/url-metadata";
import {
  formatClockTime,
  getClockTimeParts,
  normalizeClockWidgetConfig,
} from "@/lib/profile/clock";
import type { ProfileBentoItem } from "@/lib/profile/types";
import { cn } from "@/lib/utils";

const getClockTimezoneLabel = (timezone: string) => {
  const labelByTimezone: Record<string, string> = {
    "America/Los_Angeles": "Los Angeles",
    "America/New_York": "New York",
    "Asia/Seoul": "Seoul",
    "Asia/Shanghai": "Shanghai",
    "Asia/Singapore": "Singapore",
    "Asia/Tokyo": "Tokyo",
    "Australia/Sydney": "Sydney",
    "Europe/London": "London",
    "Europe/Paris": "Paris",
    UTC: "UTC",
  };

  return labelByTimezone[timezone] ?? timezone.split("/").pop() ?? timezone;
};

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

  if (item.type === "clock") {
    return <ClockBento activeBreakpoint={activeBreakpoint} item={item} />;
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

function useClockNow() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  return now;
}

function getClockTypographyClassName(w: number, h: number) {
  if (w >= 4 || h >= 4) {
    return "text-[clamp(2rem,4vw,3.6rem)]";
  }

  if (w >= 3 || h >= 3) {
    return "text-[clamp(1.75rem,3.4vw,2.8rem)]";
  }

  if (w === 1) {
    return "text-[clamp(1rem,2.4vw,1.3rem)]";
  }

  return "text-[clamp(1.35rem,2.8vw,2rem)]";
}

function ClockBento({
  item,
  activeBreakpoint,
}: {
  item: Extract<ProfileBentoItem, { type: "clock" }>;
  activeBreakpoint: GridBreakpoint;
}) {
  const now = useClockNow();
  const layout = item.layout[activeBreakpoint];
  const content = { ...normalizeClockWidgetConfig(item.content), showSeconds: true };
  const backgroundColor = content.style.backgroundColor;
  const backgroundColorOption = getBackgroundColorOption(backgroundColor);
  const timezone = content.timezone ?? content.timeZone ?? "";
  const timezoneLabel = getClockTimezoneLabel(timezone);
  const timeParts = getClockTimeParts(now, content);
  const clockLabel = formatClockTime(now, content);

  return (
    <article
      className="flex size-full min-h-0 flex-col overflow-hidden rounded-[1.5rem] ring-1 ring-border p-4"
      aria-label={clockLabel}
      style={{ backgroundColor }}
    >
      <div
        className={cn(
          "flex min-h-0 flex-1 flex-col gap-1 items-center justify-center text-center",
          backgroundColorOption.foregroundClassName
        )}
      >
        <time
          className={cn(
            "flex max-w-full items-center justify-center gap-1 whitespace-nowrap font-extrabold",
            getClockTypographyClassName(layout.w, layout.h)
          )}
          dateTime={now.toISOString()}
        >
          <div className="flex items-center gap-0.5 text-4xl!">
            <SlidingNumber value={timeParts.hour} padStart />
            <span aria-hidden className="-translate-y-[0.08em] text-neutral-600">
              :
            </span>
            <SlidingNumber value={timeParts.minute} padStart />
            {timeParts.second !== undefined ? (
              <>
                <span aria-hidden className="-translate-y-[0.08em] text-neutral-600">
                  :
                </span>
                <SlidingNumber value={timeParts.second} padStart />
              </>
            ) : null}
          </div>
          {timeParts.dayPeriod ? (
            <span className="ml-2 text-[0.33em] font-semibold uppercase tracking-[0.22em]">
              {timeParts.dayPeriod}
            </span>
          ) : null}
        </time>
        <span className="text-xs min-w-0 shrink truncate text-right">{timezoneLabel}</span>
      </div>
    </article>
  );
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
        "flex size-full shrink-0 items-center justify-center overflow-hidden",
        hasFavicon ? "bg-transparent" : "bg-muted/60",
        className
      )}
    >
      {hasFavicon ? (
        // biome-ignore lint/performance/noImgElement: Link favicon thumbnails are rendered directly.
        <img
          src={`${favicon}?v=2&s=130`}
          alt="favicon"
          height={40}
          width={40}
          className="w-full h-full pointer-events-none object-cover select-none"
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
      className="grid-action inline-flex size-9 md:size-10 shrink-0 rounded-lg overflow-hidden outline-none surface-bevel shadow-sm"
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
        "grid-action -ml-1 h-7 min-w-0 rounded-[4px] bg-transparent px-2 py-1.5 font-normal text-sm outline-none transition-colors placeholder:text-muted-foreground hover:bg-secondary focus-visible:bg-secondary truncate",
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

function LinkDomainText({ domain, className }: { domain: string; className?: string }) {
  return (
    <span className={cn("block truncate px-1 py-0 text-xs text-muted-foreground", className)}>
      {domain}
    </span>
  );
}

function LinkTitleText({ title, className }: { title: string; className?: string }) {
  return (
    <h2
      className={cn(
        "grid-action -ml-1 h-7 min-w-0 truncate rounded-[4px] px-2 py-1.5 font-normal text-sm outline-none",
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
      className="grid-action inline-flex size-9 shrink-0 overflow-hidden rounded-lg outline-none surface-bevel shadow-sm md:size-10"
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
        "grid-action rounded-xs outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-ring/50 !bg-[var(--link-provider-action-background)] !text-[var(--link-provider-action-foreground)]",
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
  "inline-flex h-8 max-w-fit shrink-0 items-center justify-center truncate rounded-md px-4 font-medium leading-none text-xs";

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
        "grid-action rounded-xs outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-ring/50 !bg-[var(--link-provider-action-background)] !text-[var(--link-provider-action-foreground)]",
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

function getLinkProviderMetadata(item: Extract<ProfileBentoItem, { type: "link" }>) {
  return item.content.metadata?.providerMetadata ?? null;
}

function getLinkSpotifyEmbedUri(item: Extract<ProfileBentoItem, { type: "link" }>) {
  return getSpotifyProviderEmbedUri(getLinkProviderMetadata(item));
}

function getLinkProviderActionLabel(
  providerTheme: LinkProviderTheme | null,
  providerMetadata: NormalizedMetadata["providerMetadata"]
): string {
  if (!providerTheme) {
    return "";
  }

  if (providerTheme.provider === "youtube" && isYoutubeProviderMetadata(providerMetadata)) {
    const subscriberCount = formatCompactCount(providerMetadata.payload.statistics.subscriberCount);

    return subscriberCount
      ? `${providerTheme.actionLabel} ${subscriberCount}`
      : providerTheme.actionLabel;
  }

  if (providerTheme.provider === "discord" && isDiscordProviderMetadata(providerMetadata)) {
    const memberCount = formatCompactCount(providerMetadata.payload.memberCount);

    return memberCount ? `${providerTheme.actionLabel} ${memberCount}` : providerTheme.actionLabel;
  }

  if (providerTheme.provider === "twitch" && isTwitchProviderMetadata(providerMetadata)) {
    const followerCount = formatCompactCount(providerMetadata.payload.followerCount);

    return followerCount
      ? `${providerTheme.actionLabel} ${followerCount}`
      : providerTheme.actionLabel;
  }

  if (providerTheme.provider === "chzzk" && isChzzkProviderMetadata(providerMetadata)) {
    const followerCount = formatCompactCount(providerMetadata.payload.followerCount);

    return followerCount
      ? `${providerTheme.actionLabel} ${followerCount}`
      : providerTheme.actionLabel;
  }

  return providerTheme.actionLabel;
}

function getLinkSupportingThumbnail(item: Extract<ProfileBentoItem, { type: "link" }>) {
  const providerTheme = resolveLinkProviderTheme(item.content.url);
  const providerMetadata = getLinkProviderMetadata(item);

  if (providerTheme?.provider === "youtube" && isYoutubeProviderMetadata(providerMetadata)) {
    return getYoutubeThumbnailUrl(providerMetadata.payload);
  }

  return item.content.thumbnail;
}

type GithubContributionsGridMetrics = {
  cellSize: number;
  columns: number;
  rows: number;
};

function calculateGithubContributionsGridMetrics(
  width: number,
  height: number,
  count: number,
  gap = 6
): GithubContributionsGridMetrics {
  if (count <= 0) {
    return {
      cellSize: 0,
      columns: 0,
      rows: 0,
    };
  }

  if (width <= 0 || height <= 0) {
    return {
      cellSize: 8,
      columns: count,
      rows: 1,
    };
  }

  let best: GithubContributionsGridMetrics = {
    cellSize: 1,
    columns: count,
    rows: 1,
  };

  for (let columns = 1; columns <= count; columns += 1) {
    const rows = Math.ceil(count / columns);
    const widthLimitedSize = (width - gap * (columns - 1)) / columns;
    const heightLimitedSize = (height - gap * (rows - 1)) / rows;
    const cellSize = Math.floor(Math.min(widthLimitedSize, heightLimitedSize));

    if (cellSize > best.cellSize) {
      best = {
        cellSize,
        columns,
        rows,
      };
    }
  }

  return {
    cellSize: Math.max(1, best.cellSize),
    columns: best.columns,
    rows: best.rows,
  };
}

function GithubContributionsPanel({
  metadata,
  className,
}: {
  metadata: NormalizedMetadata;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const providerMetadata = metadata.providerMetadata;
  const [gridMetrics, setGridMetrics] = useState<GithubContributionsGridMetrics>({
    cellSize: 12,
    columns: 7,
    rows: 1,
  });
  const isGithubContributions = isGithubContributionsProviderMetadata(providerMetadata);
  const dayCount = isGithubContributions ? providerMetadata.payload.days.length : 0;

  useLayoutEffect(() => {
    const updateGridMetrics = () => {
      const rect = containerRef.current?.getBoundingClientRect();

      if (!rect || rect.width <= 0 || rect.height <= 0) {
        return;
      }

      setGridMetrics(calculateGithubContributionsGridMetrics(rect.width, rect.height, dayCount));
    };

    updateGridMetrics();

    const observer = new ResizeObserver(updateGridMetrics);

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [dayCount]);

  if (!isGithubContributions) {
    return null;
  }

  const { payload } = providerMetadata;

  return (
    <div
      aria-hidden
      className={cn(
        "relative h-full w-full min-h-0 min-w-0 overflow-hidden select-none",
        className
      )}
      ref={containerRef}
    >
      <div className="flex h-full w-full items-center justify-center">
        <div
          className="grid gap-1.5"
          style={{
            gridTemplateColumns: `repeat(${gridMetrics.columns}, ${gridMetrics.cellSize}px)`,
            gridTemplateRows: `repeat(${gridMetrics.rows}, ${gridMetrics.cellSize}px)`,
          }}
        >
          {payload.days.map((day) => (
            <div
              key={day.date}
              className="rounded-[3px] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.04)]"
              style={{ backgroundColor: day.color }}
              title={day.date}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function LinkSupportingPanel({
  item,
  className,
}: {
  item: Extract<ProfileBentoItem, { type: "link" }>;
  className?: string;
}) {
  const providerTheme = resolveLinkProviderTheme(item.content.url);
  const metadata = item.content.metadata ?? null;

  if (providerTheme?.provider === "github") {
    if (metadata && isGithubContributionsProviderMetadata(metadata.providerMetadata)) {
      return <GithubContributionsPanel metadata={metadata} className={className} />;
    }

    return <LinkThumbnail thumbnail={getLinkSupportingThumbnail(item)} className={className} />;
  }

  return <LinkThumbnail thumbnail={getLinkSupportingThumbnail(item)} className={className} />;
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
  const spotifyEmbedUri = getLinkSpotifyEmbedUri(item);

  if (spotifyEmbedUri) {
    return <SpotifyEmbedPanel uri={spotifyEmbedUri} className="size-full min-h-0 min-w-0" />;
  }

  const providerTheme = resolveLinkProviderTheme(item.content.url);
  const providerActionLabel = getLinkProviderActionLabel(
    providerTheme,
    getLinkProviderMetadata(item)
  );

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
            label={providerActionLabel}
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
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <ReadonlyLinkFavicon
              favicon={item.content.favicon}
              href={item.content.url}
              preventNavigation={preventNavigation}
              title={item.content.title}
            />
            <div className="-ml-1 flex min-w-0 flex-col gap-0">
              <ReadonlyLinkTitle title={item.content.title} className="w-full" />
              <LinkDomainText domain={item.content.domain} className="w-full" />
            </div>
          </div>
          {providerTheme ? (
            <ReadonlyLinkAction
              backgroundColor={providerTheme.actionBackgroundColor}
              foregroundColor={providerTheme.actionForegroundColor}
              href={item.content.url}
              label={providerActionLabel}
              preventNavigation={preventNavigation}
            />
          ) : null}
        </div>
        <LinkSupportingPanel item={item} className="h-full w-[46%] min-h-0 min-w-0 shrink-0" />
      </article>
    );
  }

  if (layoutSize === "2x4") {
    return (
      <article className="flex size-full min-h-0 flex-col justify-between gap-3 overflow-hidden rounded-lg p-2">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col justify-between">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <ReadonlyLinkFavicon
              favicon={item.content.favicon}
              href={item.content.url}
              preventNavigation={preventNavigation}
              title={item.content.title}
            />
            <div className="-ml-1 flex min-w-0 flex-col gap-0">
              <ReadonlyLinkTitle title={item.content.title} className="w-full" />
              <LinkDomainText domain={item.content.domain} className="w-full" />
            </div>
          </div>
          {providerTheme ? (
            <ReadonlyLinkAction
              backgroundColor={providerTheme.actionBackgroundColor}
              foregroundColor={providerTheme.actionForegroundColor}
              href={item.content.url}
              label={providerActionLabel}
              preventNavigation={preventNavigation}
            />
          ) : null}
        </div>
        <LinkSupportingPanel item={item} className="h-[42%] w-full min-h-0 min-w-0 shrink-0" />
      </article>
    );
  }

  if (layoutSize === "1x4") {
    return (
      <article className="flex size-full min-h-0 flex-col justify-between gap-3 overflow-hidden rounded-lg p-2">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col justify-between">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <ReadonlyLinkFavicon
              favicon={item.content.favicon}
              href={item.content.url}
              preventNavigation={preventNavigation}
              title={item.content.title}
            />
            <div className="-ml-1 flex min-w-0 flex-col gap-0">
              <ReadonlyLinkTitle title={item.content.title} className="w-full" />
              <LinkDomainText domain={item.content.domain} className="w-full" />
            </div>
          </div>
          {providerTheme ? (
            <ReadonlyLinkAction
              backgroundColor={providerTheme.actionBackgroundColor}
              foregroundColor={providerTheme.actionForegroundColor}
              href={item.content.url}
              label={providerActionLabel}
              preventNavigation={preventNavigation}
            />
          ) : null}
        </div>
        <LinkSupportingPanel item={item} className="h-[42%] w-full min-h-0 min-w-0 shrink-0" />
      </article>
    );
  }

  return (
    <article className="flex size-full min-h-0 flex-col justify-between gap-3 overflow-hidden rounded-lg p-2">
      <div className="flex min-w-0 flex-col gap-1">
        <ReadonlyLinkFavicon
          favicon={item.content.favicon}
          href={item.content.url}
          preventNavigation={preventNavigation}
          title={item.content.title}
        />
        <div className="-ml-1 flex min-w-0 flex-col gap-0">
          <ReadonlyLinkTitle title={item.content.title} className="w-full" />
          <LinkDomainText domain={item.content.domain} className="w-full" />
        </div>
      </div>
      {providerTheme ? (
        <ReadonlyLinkAction
          backgroundColor={providerTheme.actionBackgroundColor}
          foregroundColor={providerTheme.actionForegroundColor}
          href={item.content.url}
          label={providerActionLabel}
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
  const spotifyEmbedUri = getLinkSpotifyEmbedUri(item);

  if (spotifyEmbedUri) {
    return (
      <SpotifyEmbedPanel
        uri={spotifyEmbedUri}
        showDragHandle
        className="size-full min-h-0 min-w-0"
      />
    );
  }

  const providerTheme = resolveLinkProviderTheme(item.content.url);
  const providerActionLabel = getLinkProviderActionLabel(
    providerTheme,
    getLinkProviderMetadata(item)
  );

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
            label={providerActionLabel}
          />
        ) : null}
      </article>
    );
  }

  if (size === "2x2") {
    return (
      <article className="flex size-full min-h-0 gap-3 overflow-hidden rounded-lg p-2">
        <div className="flex min-w-0 flex-1 flex-col justify-between">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <EditableLinkFavicon
              favicon={item.content.favicon}
              href={item.content.url}
              title={item.content.title}
            />
            <div className="-ml-1 flex min-w-0 flex-col gap-0">
              <LinkTitleInput item={item} onChange={onChange} className="w-full" />
              <LinkDomainText domain={item.content.domain} className="w-full" />
            </div>
          </div>
          {providerTheme ? (
            <EditableLinkProviderAction
              backgroundColor={providerTheme.actionBackgroundColor}
              foregroundColor={providerTheme.actionForegroundColor}
              href={item.content.url}
              label={providerActionLabel}
            />
          ) : null}
        </div>

        <LinkSupportingPanel item={item} className="h-full w-[46%] shrink-0" />
      </article>
    );
  }

  if (size === "2x4") {
    return (
      <article className="flex size-full min-h-0 flex-col justify-between gap-3 overflow-hidden rounded-lg p-2">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col justify-between">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <EditableLinkFavicon
              favicon={item.content.favicon}
              href={item.content.url}
              title={item.content.title}
            />
            <div className="-ml-1 flex min-w-0 flex-col gap-0">
              <LinkTitleInput item={item} onChange={onChange} className="w-full" />
              <LinkDomainText domain={item.content.domain} className="w-full" />
            </div>
          </div>
          {providerTheme ? (
            <EditableLinkProviderAction
              backgroundColor={providerTheme.actionBackgroundColor}
              foregroundColor={providerTheme.actionForegroundColor}
              href={item.content.url}
              label={providerActionLabel}
            />
          ) : null}
        </div>
        <LinkSupportingPanel item={item} className="h-[42%] w-full shrink-0" />
      </article>
    );
  }

  if (size === "1x4") {
    return (
      <article className="flex size-full min-h-0 flex-col justify-between gap-3 overflow-hidden rounded-lg p-2">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col justify-between">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <EditableLinkFavicon
              favicon={item.content.favicon}
              href={item.content.url}
              title={item.content.title}
            />
            <div className="-ml-1 flex min-w-0 flex-col gap-0">
              <LinkTitleInput item={item} onChange={onChange} className="w-full" />
              <LinkDomainText domain={item.content.domain} className="w-full" />
            </div>
          </div>
          {providerTheme ? (
            <EditableLinkProviderAction
              backgroundColor={providerTheme.actionBackgroundColor}
              foregroundColor={providerTheme.actionForegroundColor}
              href={item.content.url}
              label={providerActionLabel}
            />
          ) : null}
        </div>
        <LinkSupportingPanel item={item} className="h-[42%] w-full shrink-0" />
      </article>
    );
  }

  return (
    <article className="flex size-full min-h-0 flex-col justify-between gap-3 overflow-hidden rounded-lg p-2">
      <div className="flex min-w-0 flex-col gap-1">
        <EditableLinkFavicon
          favicon={item.content.favicon}
          href={item.content.url}
          title={item.content.title}
        />
        <div className="-ml-1 flex min-w-0 flex-col gap-0">
          <LinkTitleInput item={item} onChange={onChange} className="w-full" />
          <LinkDomainText domain={item.content.domain} className="w-full" />
        </div>
      </div>
      {providerTheme ? (
        <EditableLinkProviderAction
          backgroundColor={providerTheme.actionBackgroundColor}
          foregroundColor={providerTheme.actionForegroundColor}
          href={item.content.url}
          label={providerActionLabel}
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
  const textSurface = useGridTextSurface();
  const [_scrollTop, setScrollTop] = useState(0);

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
  const placeholderClassName =
    textSurface?.foregroundClassName === "text-white"
      ? "placeholder:text-white/45"
      : "placeholder:text-black/45";

  return (
    <div className="grid-action relative size-full min-h-0 overflow-hidden rounded-lg cursor-text">
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 flex min-h-0 overflow-hidden rounded-lg p-1.5 px-2 text-lg! font-medium leading-[1.7] break-all whitespace-pre-line",
          textSurface?.foregroundClassName ?? "text-foreground",
          textSurface?.textAlignClassName ?? "text-left",
          textSurface?.verticalAlignClassName === "items-center" && "my-auto"
        )}
      ></div>
      <div
        className={cn(
          "relative z-10 flex h-full w-full min-h-0 overscroll-contain",
          textSurface?.verticalAlignClassName,
          textSurface?.hoverBackgroundClassName,
          textSurface?.focusVisibleBackgroundClassName
        )}
      >
        <Textarea
          data-placeholder="Add text..."
          ref={textareaRef}
          className={cn(
            "grid-action flex max-h-full min-h-0 w-full cursor-text! flex-col overflow-y-auto overscroll-contain rounded-lg bg-transparent p-1.5 px-2 text-[20px]! font-medium outline-none break-all whitespace-pre-line caret-foreground scrollbar-hidden-stable resize-none field-sizing-content focus-visible:ring-0 border-0",
            textSurface?.foregroundClassName ?? "text-foreground",
            placeholderClassName,
            textSurface?.textAlignClassName ?? "text-left"
          )}
          onBlur={(event) => {
            const shouldReduceMotion = window.matchMedia(
              "(prefers-reduced-motion: reduce)"
            ).matches;

            setScrollTop(0);

            event.currentTarget.scrollTo({
              behavior: shouldReduceMotion ? "auto" : "smooth",
              top: 0,
            });
          }}
          onChange={(event) => {
            const nextValue = event.target.value.replace(/\r\n?/g, "\n");

            if (nextValue === item.content.content) {
              return;
            }

            onChange({
              ...item,
              content: {
                ...item.content,
                content: nextValue,
              },
            });
          }}
          onScroll={(event) => {
            setScrollTop(event.currentTarget.scrollTop);
          }}
          placeholder="Add text..."
          spellCheck
          value={item.content.content}
        />
      </div>
      {item.content.url ? <TextLinkAction href={item.content.url} label="Open text link" /> : null}
    </div>
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
    <span className="grid-action inline-grid h-full min-w-32 max-w-full overflow-hidden rounded-lg hover:bg-secondary focus-within:bg-secondary">
      <span
        aria-hidden
        className="invisible col-start-1 row-start-1 min-w-32 max-w-full overflow-hidden whitespace-pre font-bold text-xl tracking-tight"
      >
        {item.content.title}
      </span>
      <input
        aria-label="Section title"
        className="col-start-1 row-start-1 h-full w-full min-w-32 max-w-full truncate bg-transparent px-2 font-bold text-xl tracking-tight outline-none placeholder:text-muted-foreground"
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
    // Media previews can point at blob URLs during editing and public R2 URLs after upload.
    // Use a plain img so both cases render consistently.
    // biome-ignore lint/performance/noImgElement: Media previews must support blob and public URLs.
    <img alt={item.content.alt} className="size-full object-cover" src={item.content.url} />
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
      <input
        aria-label="Media caption"
        className="grid-caption-input grid-action absolute bottom-3 left-3 max-w-[calc(100%-4.5rem)] rounded-md bg-foreground/70 backdrop-blur-sm px-2 py-2 font-medium text-sm text-primary-foreground outline-none placeholder:text-white/45"
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

const overlayTextActionLinkClassName =
  "absolute right-0 bottom-0 z-20 flex size-7 items-center justify-center rounded-full bg-white text-black shadow-md backdrop-blur-sm transition-colors hover:bg-white/60";

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
        "relative size-full overflow-hidden rounded-[1.5rem] ring-1 ring-border border-transparent bg-muted transition-all duration-200 ease-out",
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
        className="grid-caption-input grid-action absolute bottom-3 left-3 max-w-[calc(100%-4.5rem)] rounded-md bg-foreground/70 backdrop-blur-sm px-2 py-2 font-medium text-sm text-primary-foreground outline-none placeholder:text-white/45"
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
    <article className="relative size-full overflow-hidden rounded-[1.5rem] ring-1 ring-border bg-muted transition-colors duration-200 ease-out">
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
        <p className="min-w-24 pointer-events-none absolute bottom-3 left-3 line-clamp-2 max-w-[calc(100%-4.5rem)] rounded-md bg-foreground/70 backdrop-blur-sm px-2 py-1.5 font-medium text-sm text-white">
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
    return (
      <ReadonlyTextBento
        content={item.content.content}
        preventNavigation={preventNavigation}
        url={item.content.url}
      />
    );
  }

  if (item.type === "media") {
    return (
      <article className="relative size-full overflow-hidden rounded-[1.5rem] bg-muted">
        <MediaPreview item={item} />
        {item.content.caption ? (
          <p className="min-w-24 truncate pointer-events-none absolute bottom-3 left-3 line-clamp-2 max-w-[calc(100%-4.5rem)] rounded-md bg-foreground/70 backdrop-blur-sm px-2 py-1.5 font-medium text-sm text-white">
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

  if (item.type === "clock") {
    return <ClockBento activeBreakpoint={activeBreakpoint} item={item} />;
  }

  return (
    <section className="relative inline-grid h-full min-w-32 max-w-full overflow-hidden rounded-2xl">
      <h2 className="h-full w-full min-w-32 max-w-full truncate px-2 font-bold text-xl tracking-tight">
        {item.content.title}
      </h2>
    </section>
  );
}

function ReadonlyTextBento({
  content,
  preventNavigation,
  url,
}: {
  content: string;
  preventNavigation: boolean;
  url: string | null;
}) {
  const textSurface = useGridTextSurface();
  return (
    <article className="relative flex size-full min-h-0 flex-col overflow-y-auto overscroll-contain rounded-lg p-1">
      <div className={cn("flex h-full w-full", textSurface?.verticalAlignClassName)}>
        <p
          className={cn(
            "w-full whitespace-pre-line break-all text-[20px]! font-medium leading-relaxed",
            textSurface?.foregroundClassName ?? "text-foreground",
            textSurface?.textAlignClassName ?? "text-left"
          )}
        >
          {content}
        </p>
      </div>
      {url ? (
        <TextLinkAction href={url} label="Open text link" preventNavigation={preventNavigation} />
      ) : null}
    </article>
  );
}

function TextLinkAction({
  href,
  label,
  preventNavigation = false,
}: {
  href: string;
  label: string;
  preventNavigation?: boolean;
}) {
  return (
    <a
      aria-label={label}
      className={cn("grid-action", overlayTextActionLinkClassName)}
      href={href}
      onClick={preventNavigation ? (event) => event.preventDefault() : undefined}
      rel="noreferrer"
      target="_blank"
    >
      <ArrowCircleUpRightIcon aria-hidden className="size-7" weight="fill" />
    </a>
  );
}
