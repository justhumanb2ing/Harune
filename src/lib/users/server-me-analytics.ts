import "server-only";

import { cookies } from "next/headers";
import { getMeAnalytics } from "@/lib/api/generated/http/me-api/me-api";
import { ApiError } from "@/lib/react-query/fetcher";

export async function getServerMeAnalytics() {
  const requestCookies = await cookies();
  const cookieHeader = requestCookies.toString();

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
