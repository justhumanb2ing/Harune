export type UrlMetadata = {
  title: string | null;
  description: string | null;
  sitename: string | null;
  image: string | null;
  favicon: string | null;
  url: string;
  readMode: "head" | "document";
};

const maxHeadBytes = 128 * 1024;
const fetchTimeoutMs = 8000;

const htmlEntityMap: Record<string, string> = {
  amp: "&",
  apos: "'",
  gt: ">",
  lt: "<",
  nbsp: " ",
  quot: '"',
};

function cleanText(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const decoded = decodeHtmlEntities(value).replace(/\s+/g, " ").trim();

  return decoded || null;
}

function decodeHtmlEntities(value: string) {
  return value.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (entity, token: string) => {
    const normalized = token.toLowerCase();

    if (normalized.startsWith("#x")) {
      return String.fromCodePoint(Number.parseInt(normalized.slice(2), 16));
    }

    if (normalized.startsWith("#")) {
      return String.fromCodePoint(Number.parseInt(normalized.slice(1), 10));
    }

    return htmlEntityMap[normalized] ?? entity;
  });
}

function parseAttributes(tag: string) {
  const attributes = new Map<string, string>();
  const attributeRegex = /([^\s"'<>/=]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/g;

  for (const match of tag.matchAll(attributeRegex)) {
    const name = match[1]?.toLowerCase();
    const value = match[2] ?? match[3] ?? match[4] ?? "";

    if (name) {
      attributes.set(name, value);
    }
  }

  return attributes;
}

function collectMetaTags(html: string) {
  const tags: Array<Map<string, string>> = [];

  for (const match of html.matchAll(/<meta\b[^>]*>/gi)) {
    tags.push(parseAttributes(match[0]));
  }

  return tags;
}

function collectLinkTags(html: string) {
  const tags: Array<Map<string, string>> = [];

  for (const match of html.matchAll(/<link\b[^>]*>/gi)) {
    tags.push(parseAttributes(match[0]));
  }

  return tags;
}

function getMetaContent(metaTags: Array<Map<string, string>>, keys: string[]) {
  const lowerKeys = new Set(keys.map((key) => key.toLowerCase()));

  for (const tag of metaTags) {
    const identifier =
      tag.get("property")?.toLowerCase() ??
      tag.get("name")?.toLowerCase() ??
      tag.get("itemprop")?.toLowerCase();

    if (identifier && lowerKeys.has(identifier)) {
      const content = cleanText(tag.get("content"));

      if (content) {
        return content;
      }
    }
  }

  return null;
}

function getDocumentTitle(html: string) {
  const titleMatch = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
  return cleanText(titleMatch?.[1]);
}

function getLinkHref(linkTags: Array<Map<string, string>>, relCandidates: string[]) {
  const candidates = relCandidates.map((candidate) => candidate.toLowerCase());

  for (const relCandidate of candidates) {
    for (const tag of linkTags) {
      const rel = tag.get("rel")?.toLowerCase();

      if (!rel) {
        continue;
      }

      const relTokens = new Set(rel.split(/\s+/));
      const isMatch =
        rel === relCandidate || relCandidate.split(/\s+/).every((token) => relTokens.has(token));

      if (isMatch) {
        const href = cleanText(tag.get("href"));

        if (href) {
          return href;
        }
      }
    }
  }

  return null;
}

function getBestFaviconHref(linkTags: Array<Map<string, string>>) {
  let bestCandidate: { href: string; score: number } | null = null;

  for (const tag of linkTags) {
    const href = cleanText(tag.get("href"));
    const rel = tag.get("rel")?.toLowerCase();

    if (!href || !rel) {
      continue;
    }

    const relTokens = new Set(rel.split(/\s+/));
    const isIcon =
      relTokens.has("icon") ||
      relTokens.has("apple-touch-icon") ||
      relTokens.has("apple-touch-icon-precomposed");

    if (!isIcon) {
      continue;
    }

    const type = tag.get("type")?.toLowerCase() ?? "";
    const sizes = tag.get("sizes")?.toLowerCase() ?? "";
    const score = getFaviconScore({ href, relTokens, sizes, type });

    if (!bestCandidate || score > bestCandidate.score) {
      bestCandidate = { href, score };
    }
  }

  return bestCandidate?.href ?? null;
}

function getFaviconScore({
  href,
  relTokens,
  sizes,
  type,
}: {
  href: string;
  relTokens: Set<string>;
  sizes: string;
  type: string;
}) {
  if (type.includes("svg") || href.toLowerCase().endsWith(".svg") || sizes === "any") {
    return 1_000_000;
  }

  let largestArea = 0;

  for (const match of sizes.matchAll(/(\d+)x(\d+)/g)) {
    const width = Number.parseInt(match[1] ?? "0", 10);
    const height = Number.parseInt(match[2] ?? "0", 10);
    largestArea = Math.max(largestArea, width * height);
  }

  const appleTouchBoost =
    relTokens.has("apple-touch-icon") || relTokens.has("apple-touch-icon-precomposed") ? 1000 : 0;

  if (largestArea > 0) {
    return largestArea + appleTouchBoost;
  }

  return appleTouchBoost;
}

function resolveUrl(value: string | null, baseUrl: string) {
  if (!value) {
    return null;
  }

  try {
    return new URL(value, baseUrl).toString();
  } catch {
    return null;
  }
}

function validateFetchUrl(value: string) {
  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw new Error("Invalid URL.");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Only HTTP and HTTPS URLs are supported.");
  }

  return url;
}

type HeadReadResult = {
  html: string;
  readMode: UrlMetadata["readMode"];
};

async function readHeadText(response: Response): Promise<HeadReadResult> {
  if (!response.body) {
    const html = await response.text();
    const headEndIndex = html.search(/<\/head\s*>/i);

    if (headEndIndex === -1) {
      return {
        html,
        readMode: "document",
      };
    }

    const headBytes = new TextEncoder().encode(html.slice(0, headEndIndex + "</head>".length));

    if (headBytes.byteLength > maxHeadBytes) {
      return {
        html,
        readMode: "document",
      };
    }

    return {
      html: html.slice(0, headEndIndex + "</head>".length),
      readMode: "head",
    };
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let receivedBytes = 0;
  let readMode: UrlMetadata["readMode"] = "head";

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    if (!value) {
      continue;
    }

    chunks.push(value);
    receivedBytes += value.byteLength;

    if (receivedBytes > maxHeadBytes) {
      readMode = "document";
    }

    const html = new TextDecoder().decode(Buffer.concat(chunks));

    if (readMode === "head" && /<\/head\s*>/i.test(html)) {
      await reader.cancel();
      return {
        html: html.slice(0, html.search(/<\/head\s*>/i) + "</head>".length),
        readMode: "head",
      };
    }
  }

  return {
    html: new TextDecoder().decode(Buffer.concat(chunks)),
    readMode,
  };
}

export async function fetchUrlMetadata(inputUrl: string): Promise<UrlMetadata> {
  const requestedUrl = validateFetchUrl(inputUrl);
  const response = await fetch(requestedUrl, {
    cache: "no-store",
    headers: {
      Accept: "text/html,application/xhtml+xml",
      "User-Agent": "Harune metadata fetcher",
    },
    signal: AbortSignal.timeout(fetchTimeoutMs),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch URL. Status: ${response.status}`);
  }

  const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";

  if (contentType && !contentType.includes("html") && !contentType.includes("text/plain")) {
    throw new Error("URL did not return an HTML document.");
  }

  const finalUrl = response.url || requestedUrl.toString();
  const { html, readMode } = await readHeadText(response);
  const metaTags = collectMetaTags(html);
  const linkTags = collectLinkTags(html);
  const canonicalUrl = resolveUrl(getLinkHref(linkTags, ["canonical"]), finalUrl);
  const metadataUrl = resolveUrl(getMetaContent(metaTags, ["og:url", "twitter:url"]), finalUrl);
  const favicon =
    resolveUrl(getBestFaviconHref(linkTags), finalUrl) ?? `${new URL(finalUrl).origin}/favicon.ico`;

  return {
    title: getMetaContent(metaTags, ["og:title", "twitter:title"]) ?? getDocumentTitle(html),
    description: getMetaContent(metaTags, ["og:description", "description", "twitter:description"]),
    sitename: getMetaContent(metaTags, ["og:site_name", "application-name"]),
    image: resolveUrl(getMetaContent(metaTags, ["og:image", "twitter:image", "image"]), finalUrl),
    favicon,
    url: metadataUrl ?? canonicalUrl ?? finalUrl,
    readMode,
  };
}
