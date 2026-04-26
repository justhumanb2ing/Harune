import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "./auth";

const APP_API_PREFIX = "/api/app";
const APP_ENTRY_PATH = "/post-sign-in";
const SIGN_IN_PATH = "/sign-in";

const AUTH_PAGE_PREFIXES = [SIGN_IN_PATH, "/sign-up"] as const;
const AUTH_REQUIRED_PAGE_PREFIXES = [
  "/profile",
  "/subscribe",
  "/onboarding",
  APP_ENTRY_PATH,
] as const;

export async function proxy(req: NextRequest) {
  const session = await auth();
  const isAuth = !!session?.user;
  const pathname = req.nextUrl.pathname;
  const legacyRedirectPath = getLegacyRedirectPath(pathname);

  if (legacyRedirectPath) {
    const redirectUrl = new URL(legacyRedirectPath, req.url);
    redirectUrl.search = req.nextUrl.search;
    return NextResponse.redirect(redirectUrl);
  }

  if (isAuthPage(pathname)) {
    if (isAuth) {
      return NextResponse.redirect(new URL(APP_ENTRY_PATH, req.url));
    }
    return NextResponse.next();
  }

  if (isAppApiRoute(pathname)) {
    if (!isAuth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.next();
  }

  if (!isAuth && isAuthRequiredPage(pathname)) {
    return NextResponse.redirect(createSignInUrl(req));
  }

  return NextResponse.next();
}

function getLegacyRedirectPath(pathname: string) {
  if (pathname === "/app" || pathname === "/plan") {
    return APP_ENTRY_PATH;
  }

  const [, handle, area, ...rest] = pathname.split("/");
  if (handle && area === "section") {
    return `/${handle}/app${rest.length > 0 ? `/${rest.join("/")}` : ""}`;
  }

  if (pathname.startsWith("/app/")) {
    return APP_ENTRY_PATH;
  }

  if (pathname.startsWith("/plan/")) {
    return APP_ENTRY_PATH;
  }

  return null;
}

function isAppApiRoute(pathname: string) {
  return pathname.startsWith(APP_API_PREFIX);
}

function isAuthPage(pathname: string) {
  return AUTH_PAGE_PREFIXES.some((prefix) => hasPathPrefix(pathname, prefix));
}

function isAuthRequiredPage(pathname: string) {
  return (
    AUTH_REQUIRED_PAGE_PREFIXES.some((prefix) => hasPathPrefix(pathname, prefix)) ||
    isHandleAppPath(pathname)
  );
}

function hasPathPrefix(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

function isHandleAppPath(pathname: string) {
  const [, handle, area] = pathname.split("/");

  return Boolean(handle) && (area === "app" || area === "analytics");
}

function createSignInUrl(req: NextRequest) {
  const callbackUrl = `${req.nextUrl.pathname}${req.nextUrl.search}`;
  return new URL(`${SIGN_IN_PATH}?callbackUrl=${encodeURIComponent(callbackUrl)}`, req.url);
}

export const config = {
  matcher: [
    "/api/app/:path*",
    "/app",
    "/app/:path*",
    "/plan",
    "/plan/:path*",
    "/:handle/app",
    "/:handle/app/:path*",
    "/:handle/section",
    "/:handle/section/:path*",
    "/:handle/analytics",
    "/:handle/analytics/:path*",
    "/profile/:path*",
    "/subscribe/:path*",
    "/onboarding",
    "/post-sign-in",
    "/sign-in",
    "/sign-up",
  ],
};
