import { env } from "@/env";
import { isMarkdownPreferred, rewritePath } from "fumadocs-core/negotiation";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "./auth";
const { rewrite: rewriteLLM } = rewritePath("/docs/*path", "/llms.mdx/*path");

export async function proxy(req: NextRequest) {
  if (isMarkdownPreferred(req)) {
    const result = rewriteLLM(req.nextUrl.pathname);
    if (result) {
      return NextResponse.rewrite(new URL(result, req.nextUrl));
    }
  }

  const session = await auth();
  const isAuth = !!session?.user;
  const pathname = req.nextUrl.pathname;

  const isAPI = pathname.startsWith("/api/app");
  const isInAppRoute =
    pathname === "/billing" ||
    pathname.startsWith("/billing/") ||
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

  if (req.nextUrl.pathname.startsWith("/super-admin")) {
    const adminEmails = env.SUPER_ADMIN_EMAILS?.split(",");
    const currentUserEmail = session?.user?.email;
    if (!currentUserEmail || !adminEmails?.includes(currentUserEmail)) {
      return NextResponse.redirect(new URL("/sign-in?error=unauthorized", req.url));
    }
    // Allow access to super admin pages
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/docs/:path*",
    "/api/app/:path*",
    "/app",
    "/app/:path*",
    "/billing/:path*",
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
    "/super-admin/:path*",
  ],
};
