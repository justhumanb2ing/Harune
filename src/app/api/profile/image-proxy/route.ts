const ALLOWED_HOSTNAME = "cdn.harune.me";
const ALLOWED_PROTOCOLS = new Set(["http:", "https:"]);

function createError(message: string, status: number) {
  return new Response(message, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const urlValue = searchParams.get("url");

  if (!urlValue) {
    return createError("Missing url parameter.", 400);
  }

  let url: URL;

  try {
    url = new URL(urlValue);
  } catch {
    return createError("Invalid url parameter.", 400);
  }

  if (!ALLOWED_PROTOCOLS.has(url.protocol) || url.hostname !== ALLOWED_HOSTNAME) {
    return createError("URL is not allowed.", 400);
  }

  const upstreamResponse = await fetch(url, {
    cache: "no-store",
  });

  if (!upstreamResponse.ok || !upstreamResponse.body) {
    return createError("Failed to load image.", upstreamResponse.status || 502);
  }

  const headers = new Headers();
  const contentType = upstreamResponse.headers.get("content-type");
  const contentLength = upstreamResponse.headers.get("content-length");
  const etag = upstreamResponse.headers.get("etag");
  const lastModified = upstreamResponse.headers.get("last-modified");

  if (contentType) {
    headers.set("Content-Type", contentType);
  }

  if (contentLength) {
    headers.set("Content-Length", contentLength);
  }

  if (etag) {
    headers.set("ETag", etag);
  }

  if (lastModified) {
    headers.set("Last-Modified", lastModified);
  }

  headers.set("Cache-Control", "private, no-store");

  return new Response(upstreamResponse.body, {
    headers,
    status: upstreamResponse.status,
  });
}
