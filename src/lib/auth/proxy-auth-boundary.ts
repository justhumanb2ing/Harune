const APP_ENTRY_PATH = "/post-sign-in";
const SIGN_IN_PATH = "/sign-in";

const AUTH_PAGE_PREFIXES = [SIGN_IN_PATH, "/sign-up"] as const;
const AUTH_REQUIRED_PAGE_PREFIXES = ["/profile", "/subscribe", "/create", APP_ENTRY_PATH] as const;

export type ProxyAuthSignal = {
  hasSessionSignal: boolean;
};

export type ProxyRouteDecision = { kind: "next" } | { kind: "redirect"; url: URL };

export function getLegacyRedirectPath(pathname: string) {
  if (pathname === "/app" || pathname === "/plan") {
    return APP_ENTRY_PATH;
  }

  if (pathname.startsWith("/app/")) {
    return APP_ENTRY_PATH;
  }

  if (pathname.startsWith("/plan/")) {
    return APP_ENTRY_PATH;
  }

  return null;
}

export function getProxyRouteDecision({
  hasSessionSignal,
  requestUrl,
}: ProxyAuthSignal & {
  requestUrl: URL;
}): ProxyRouteDecision {
  const pathname = requestUrl.pathname;
  const legacyRedirectPath = getLegacyRedirectPath(pathname);

  if (legacyRedirectPath) {
    const redirectUrl = new URL(legacyRedirectPath, requestUrl);
    redirectUrl.search = requestUrl.search;
    return { kind: "redirect", url: redirectUrl };
  }

  if (isAuthPage(pathname)) {
    if (hasSessionSignal) {
      return { kind: "redirect", url: createPostSignInUrl(requestUrl) };
    }
    return { kind: "next" };
  }

  if (!hasSessionSignal && isAuthRequiredPage(pathname)) {
    return { kind: "redirect", url: createSignInUrl(requestUrl) };
  }

  return { kind: "next" };
}

export function isAuthPage(pathname: string) {
  return AUTH_PAGE_PREFIXES.some((prefix) => hasPathPrefix(pathname, prefix));
}

export function isAuthRequiredPage(pathname: string) {
  return (
    AUTH_REQUIRED_PAGE_PREFIXES.some((prefix) => hasPathPrefix(pathname, prefix)) ||
    isHandleAppPath(pathname)
  );
}

export function hasPathPrefix(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function isHandleAppPath(pathname: string) {
  const [, handle, area] = pathname.split("/");

  return Boolean(handle) && handle !== "api" && (area === "app" || area === "analytics");
}

export function createSignInUrl(requestUrl: URL) {
  const callbackUrl = `${requestUrl.pathname}${requestUrl.search}`;
  return new URL(`${SIGN_IN_PATH}?callbackUrl=${encodeURIComponent(callbackUrl)}`, requestUrl);
}

export function createPostSignInUrl(requestUrl: URL) {
  const redirectUrl = new URL(APP_ENTRY_PATH, requestUrl);
  const callbackUrl = requestUrl.searchParams.get("callbackUrl");
  const handle = requestUrl.searchParams.get("handle");

  if (callbackUrl) {
    redirectUrl.searchParams.set("next", callbackUrl);
  }

  if (handle) {
    redirectUrl.searchParams.set("handle", handle);
  }

  return redirectUrl;
}
