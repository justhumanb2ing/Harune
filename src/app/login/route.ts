import { getSessionCookie } from "better-auth/cookies";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";

export function GET(request: NextRequest) {
  redirect(getSessionCookie(request) ? "/join" : "/sign-in");
}
