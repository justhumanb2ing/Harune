export type GithubContributionsDay = {
  date: string;
  contributionCount: number;
  contributionLevel: string;
  color: string;
  weekday: number;
};

export type GithubContributionsPayload = {
  login: string;
  name: string | null;
  avatarUrl: string | null;
  profileUrl: string;
  rangeStart: string;
  rangeEnd: string;
  totalContributions: number;
  days: GithubContributionsDay[];
};

export type GithubContributionsViewType = `github_contributions_${number}d`;

export type MetadataProviderMetadata = {
  provider: string;
  viewType: string;
  fetchedAt: string;
  payload: Record<string, unknown>;
};

export type GithubContributionsProviderMetadata = {
  viewType: GithubContributionsViewType;
  payload: GithubContributionsPayload;
};

export type YoutubeProviderMetadata = {
  provider: "youtube";
  viewType: string;
  fetchedAt: string;
  payload: {
    snippet?: {
      thumbnails?: {
        high?: {
          url: string;
        };
      };
      title?: string;
      description?: string;
    };
    thumbnails?: {
      high: {
        url: string;
      };
    };
    statistics: {
      subscriberCount: string | number;
    };
  };
};

export type ChzzkProviderMetadata = {
  provider: "chzzk";
  viewType: string;
  fetchedAt: string;
  payload: {
    channelId?: string;
    channelName?: string;
    channelImageUrl?: string;
    followerCount: string | number;
    verifiedMark?: boolean;
  };
};

export type NormalizedMetadata = {
  url: string;
  domain: string;
  title: string | null;
  description: string | null;
  image: string | null;
  siteName: string | null;
  favicon: string | null;
  provider: string | null;
  providerMetadata:
    | MetadataProviderMetadata
    | GithubContributionsProviderMetadata
    | YoutubeProviderMetadata
    | ChzzkProviderMetadata
    | null;
};

export type MetadataErrorDetails = Record<string, string | number | boolean | null>;

export type MetadataErrorCode =
  | "missing_url"
  | "invalid_url"
  | "invalid_protocol"
  | "blocked_host"
  | "fetch_failed"
  | "bad_gateway"
  | "not_found"
  | "internal_error";

export type MetadataErrorResponse = {
  error: MetadataErrorCode;
  message: string;
  details?: MetadataErrorDetails;
};

export type MetadataCause = {
  error?: MetadataErrorCode;
  [key: string]: string | number | boolean | null | undefined;
};

export type ImageCandidate = {
  url: string;
  width: number | null;
  height: number | null;
  order: number;
  source: "og" | "twitter";
};

export type IconCandidate = {
  url: string;
  score: number;
  order: number;
};

const metadataBaseUrl = "https://api.harune.me/metadata";
const fetchTimeoutMs = 8000;
const metadataFetchHeaders = {
  Accept: "application/json",
} satisfies HeadersInit;

export class MetadataFetchError extends Error {
  status: number;
  body: MetadataErrorResponse;

  constructor(status: number, body: MetadataErrorResponse) {
    super(body.message);
    this.name = "MetadataFetchError";
    this.status = status;
    this.body = body;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isMetadataErrorCode(value: unknown): value is MetadataErrorCode {
  return (
    value === "missing_url" ||
    value === "invalid_url" ||
    value === "invalid_protocol" ||
    value === "blocked_host" ||
    value === "fetch_failed" ||
    value === "bad_gateway" ||
    value === "not_found" ||
    value === "internal_error"
  );
}

function isMetadataDetails(value: unknown): value is MetadataErrorDetails {
  return (
    isRecord(value) &&
    Object.values(value).every(
      (entry) =>
        entry === null ||
        typeof entry === "string" ||
        typeof entry === "number" ||
        typeof entry === "boolean"
    )
  );
}

function isGithubContributionsDay(value: unknown): value is GithubContributionsDay {
  return (
    isRecord(value) &&
    typeof value.date === "string" &&
    typeof value.contributionCount === "number" &&
    typeof value.contributionLevel === "string" &&
    typeof value.color === "string" &&
    typeof value.weekday === "number"
  );
}

function isGithubContributionsPayload(value: unknown): value is GithubContributionsPayload {
  return (
    isRecord(value) &&
    typeof value.login === "string" &&
    (typeof value.name === "string" || value.name === null) &&
    (typeof value.avatarUrl === "string" || value.avatarUrl === null) &&
    typeof value.profileUrl === "string" &&
    typeof value.rangeStart === "string" &&
    typeof value.rangeEnd === "string" &&
    typeof value.totalContributions === "number" &&
    Array.isArray(value.days) &&
    value.days.every(isGithubContributionsDay)
  );
}

function isYoutubeProviderMetadataPayload(
  value: unknown
): value is YoutubeProviderMetadata["payload"] {
  const topLevelThumbnailUrl =
    isRecord(value) &&
    isRecord(value.thumbnails) &&
    isRecord(value.thumbnails.high) &&
    typeof value.thumbnails.high.url === "string"
      ? value.thumbnails.high.url
      : null;
  const nestedThumbnailUrl =
    isRecord(value) &&
    isRecord(value.snippet) &&
    isRecord(value.snippet.thumbnails) &&
    isRecord(value.snippet.thumbnails.high) &&
    typeof value.snippet.thumbnails.high.url === "string"
      ? value.snippet.thumbnails.high.url
      : null;

  return (
    isRecord(value) &&
    isRecord(value.statistics) &&
    (typeof value.statistics.subscriberCount === "string" ||
      typeof value.statistics.subscriberCount === "number") &&
    Boolean(topLevelThumbnailUrl || nestedThumbnailUrl)
  );
}

function isChzzkProviderMetadataPayload(value: unknown): value is ChzzkProviderMetadata["payload"] {
  return (
    isRecord(value) &&
    (typeof value.followerCount === "string" || typeof value.followerCount === "number")
  );
}

function normalizeProviderMetadata(
  value: unknown
):
  | MetadataProviderMetadata
  | GithubContributionsProviderMetadata
  | YoutubeProviderMetadata
  | ChzzkProviderMetadata
  | null {
  if (
    !isRecord(value) ||
    typeof value.provider !== "string" ||
    typeof value.viewType !== "string" ||
    typeof value.fetchedAt !== "string" ||
    !isRecord(value.payload)
  ) {
    return null;
  }

  if (/^github_contributions_\d+d$/.test(value.viewType)) {
    if (!isGithubContributionsPayload(value.payload)) {
      return null;
    }

    return {
      provider: value.provider,
      viewType: value.viewType,
      fetchedAt: value.fetchedAt,
      payload: {
        login: value.payload.login,
        name: value.payload.name,
        avatarUrl: value.payload.avatarUrl,
        profileUrl: value.payload.profileUrl,
        rangeStart: value.payload.rangeStart,
        rangeEnd: value.payload.rangeEnd,
        totalContributions: value.payload.totalContributions,
        days: value.payload.days.map((day) => ({
          date: day.date,
          contributionCount: day.contributionCount,
          contributionLevel: day.contributionLevel,
          color: day.color,
          weekday: day.weekday,
        })),
      },
    };
  }

  if (value.provider === "youtube" && isYoutubeProviderMetadataPayload(value.payload)) {
    return {
      provider: value.provider,
      viewType: value.viewType,
      fetchedAt: value.fetchedAt,
      payload: value.payload,
    };
  }

  if (value.provider === "chzzk" && isChzzkProviderMetadataPayload(value.payload)) {
    return {
      provider: value.provider,
      viewType: value.viewType,
      fetchedAt: value.fetchedAt,
      payload: value.payload,
    };
  }

  return {
    provider: value.provider,
    viewType: value.viewType,
    fetchedAt: value.fetchedAt,
    payload: value.payload,
  };
}

export function isGithubContributionsProviderMetadata(
  value:
    | MetadataProviderMetadata
    | GithubContributionsProviderMetadata
    | YoutubeProviderMetadata
    | null
    | undefined
): value is GithubContributionsProviderMetadata {
  return Boolean(
    value &&
      /^github_contributions_\d+d$/.test(value.viewType) &&
      isGithubContributionsPayload(value.payload)
  );
}

export function isYoutubeProviderMetadata(value: unknown): value is YoutubeProviderMetadata {
  return Boolean(
    isRecord(value) &&
      typeof value.provider === "string" &&
      value.provider === "youtube" &&
      isYoutubeProviderMetadataPayload(value.payload)
  );
}

export function isChzzkProviderMetadata(value: unknown): value is ChzzkProviderMetadata {
  return Boolean(
    isRecord(value) &&
      typeof value.provider === "string" &&
      value.provider === "chzzk" &&
      isChzzkProviderMetadataPayload(value.payload)
  );
}

export function formatCompactCount(value: string | number | null | undefined) {
  if (value === null || value === undefined) {
    return null;
  }

  const parsedValue = typeof value === "string" ? Number.parseInt(value, 10) : value;

  if (!Number.isFinite(parsedValue)) {
    return null;
  }

  if (parsedValue < 1000) {
    return `${Math.trunc(parsedValue)}`;
  }

  return new Intl.NumberFormat("en", {
    compactDisplay: "short",
    maximumFractionDigits: 1,
    notation: "compact",
  }).format(parsedValue);
}

export function getYoutubeThumbnailUrl(
  value: YoutubeProviderMetadata["payload"] | null | undefined
) {
  const topLevelUrl = value?.thumbnails?.high?.url;

  if (typeof topLevelUrl === "string" && topLevelUrl.length > 0) {
    return topLevelUrl;
  }

  const nestedUrl = value?.snippet?.thumbnails?.high?.url;

  if (typeof nestedUrl === "string" && nestedUrl.length > 0) {
    return nestedUrl;
  }

  return null;
}

function normalizeMetadataResponse(value: unknown): NormalizedMetadata {
  if (!isRecord(value)) {
    throw new Error("Invalid metadata response.");
  }

  const url = typeof value.url === "string" ? value.url : null;
  const domain = typeof value.domain === "string" ? value.domain : null;

  if (!url || !domain) {
    throw new Error("Invalid metadata response.");
  }

  return {
    url,
    domain,
    title: typeof value.title === "string" ? value.title : null,
    description: typeof value.description === "string" ? value.description : null,
    image: typeof value.image === "string" ? value.image : null,
    siteName: typeof value.siteName === "string" ? value.siteName : null,
    favicon: typeof value.favicon === "string" ? value.favicon : null,
    provider: typeof value.provider === "string" ? value.provider : null,
    providerMetadata: normalizeProviderMetadata(value.providerMetadata),
  };
}

function normalizeMetadataErrorResponse(value: unknown): MetadataErrorResponse {
  if (!isRecord(value)) {
    return {
      error: "internal_error",
      message: "Failed to fetch metadata.",
    };
  }

  const flatError =
    isMetadataErrorCode(value.error) && typeof value.message === "string"
      ? {
          error: value.error,
          message: value.message,
          details: isMetadataDetails(value.details) ? value.details : undefined,
        }
      : null;

  if (flatError) {
    return {
      error: flatError.error,
      message: flatError.message,
      ...(flatError.details ? { details: flatError.details } : {}),
    };
  }

  const nestedError =
    isRecord(value.error) &&
    isMetadataErrorCode(value.error.code) &&
    typeof value.error.message === "string"
      ? {
          error: value.error.code,
          message: value.error.message,
          details: isMetadataDetails(value.error.details) ? value.error.details : undefined,
        }
      : null;

  if (nestedError) {
    return {
      error: nestedError.error,
      message: nestedError.message,
      ...(nestedError.details ? { details: nestedError.details } : {}),
    };
  }

  return {
    error: "internal_error",
    message: "Failed to fetch metadata.",
  };
}

function createMetadataUrl(inputUrl: string) {
  const url = new URL(metadataBaseUrl);
  url.searchParams.set("url", inputUrl);
  return url;
}

export async function fetchUrlMetadata(inputUrl: string): Promise<NormalizedMetadata> {
  const response = await fetch(createMetadataUrl(inputUrl), {
    cache: "no-store",
    headers: metadataFetchHeaders,
    signal: AbortSignal.timeout(fetchTimeoutMs),
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new MetadataFetchError(response.status, normalizeMetadataErrorResponse(payload));
  }

  return normalizeMetadataResponse(payload);
}
