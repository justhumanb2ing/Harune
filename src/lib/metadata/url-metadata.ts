export type NormalizedMetadata = {
  url: string;
  canonicalUrl: string | null;
  title: string | null;
  description: string | null;
  image: string | null;
  siteName: string | null;
  favicon: string | null;
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

function normalizeMetadataResponse(value: unknown): NormalizedMetadata {
  if (!isRecord(value)) {
    throw new Error("Invalid metadata response.");
  }

  const url = typeof value.url === "string" ? value.url : null;

  if (!url) {
    throw new Error("Invalid metadata response.");
  }

  return {
    url,
    canonicalUrl: typeof value.canonicalUrl === "string" ? value.canonicalUrl : null,
    title: typeof value.title === "string" ? value.title : null,
    description: typeof value.description === "string" ? value.description : null,
    image: typeof value.image === "string" ? value.image : null,
    siteName: typeof value.siteName === "string" ? value.siteName : null,
    favicon: typeof value.favicon === "string" ? value.favicon : null,
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
