import "server-only";

import { cookies } from "next/headers";
import { ApiError } from "@/lib/api/error";
import { getMeAnalytics } from "@/lib/api/generated/http/me-api/me-api";
import { buildAuthSessionCookieHeader } from "@/lib/auth/request-cookies";

export async function getServerMeAnalytics() {
  const requestCookies = await cookies();
  const cookieHeader = buildAuthSessionCookieHeader(requestCookies);

  if (!cookieHeader) {
    return null;
  }

  try {
    return await getMeAnalytics({
      headers: {
        cookie: cookieHeader,
      },
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      return null;
    }

    throw error;
  }
}
