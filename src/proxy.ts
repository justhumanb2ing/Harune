import { getSessionCookie } from "better-auth/cookies";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getProxyRouteDecision } from "./lib/auth/proxy-auth-boundary";

export function proxy(req: NextRequest) {
  const sessionCookie = getSessionCookie(req);
  const decision = getProxyRouteDecision({
    hasSessionSignal: !!sessionCookie,
    requestUrl: req.nextUrl,
  });

  if (decision.kind === "redirect") {
    return NextResponse.redirect(decision.url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/app",
    "/app/:path*",
    "/plan",
    "/plan/:path*",
    "/:handle/app",
    "/:handle/app/:path*",
    "/:handle/analytics",
    "/:handle/analytics/:path*",
    "/profile/:path*",
    "/subscribe/:path*",
    "/create",
    "/sign-in",
    "/sign-up",
  ],
};
