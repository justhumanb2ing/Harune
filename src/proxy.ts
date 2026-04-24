import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "./auth";

export async function proxy(req: NextRequest) {
  const session = await auth();
  const isAuth = !!session?.user;
  const pathname = req.nextUrl.pathname;

  const isAPI = pathname.startsWith("/api/app");
  const isInAppRoute =
    pathname === "/section" ||
    pathname.startsWith("/section/") ||
    pathname === "/profile" ||
    pathname.startsWith("/profile/") ||
    pathname === "/subscribe" ||
    pathname.startsWith("/subscribe/");

  if (
    pathname === "/app" ||
    pathname.startsWith("/app/") ||
    pathname === "/plan" ||
    pathname.startsWith("/plan/")
  ) {
    const redirectPath =
      pathname === "/app" || pathname === "/plan"
        ? "/section"
        : pathname.startsWith("/app/")
          ? pathname.slice(4)
          : pathname.replace(/^\/plan/, "/section");
    const redirectUrl = new URL(redirectPath || "/section", req.url);
    redirectUrl.search = req.nextUrl.search;
    return NextResponse.redirect(redirectUrl);
  }

  const isAuthPage = pathname.startsWith("/sign-in") || pathname.startsWith("/sign-up");

  if (isAuthPage) {
    if (isAuth) {
      return NextResponse.redirect(new URL("/section", req.url));
    }
    return NextResponse.next();
  }

  if (isAPI) {
    if (!isAuth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.next();
  }

  if (!isAuth && isInAppRoute) {
    let callbackUrl = req.nextUrl.pathname;
    if (req.nextUrl.search) {
      callbackUrl += req.nextUrl.search;
    }

    return NextResponse.redirect(
      new URL(`/sign-in?callbackUrl=${encodeURIComponent(callbackUrl)}`, req.url)
    );
  }

  if (
    !isAuth &&
    (req.nextUrl.pathname.startsWith("/onboarding") ||
      req.nextUrl.pathname.startsWith("/post-sign-in"))
  ) {
    let callbackUrl = req.nextUrl.pathname;
    if (req.nextUrl.search) {
      callbackUrl += req.nextUrl.search;
    }

    return NextResponse.redirect(
      new URL(`/sign-in?callbackUrl=${encodeURIComponent(callbackUrl)}`, req.url)
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/api/app/:path*",
    "/app",
    "/app/:path*",
    "/plan",
    "/plan/:path*",
    "/section",
    "/section/:path*",
    "/profile/:path*",
    "/subscribe/:path*",
    "/onboarding",
    "/post-sign-in",
    "/sign-in",
    "/sign-up",
  ],
};
