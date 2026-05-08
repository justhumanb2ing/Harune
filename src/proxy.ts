import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function proxy(_req: NextRequest) {
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
