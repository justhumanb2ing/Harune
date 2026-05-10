import "server-only";

import { cookies } from "next/headers";
import { getAppApiBaseURL } from "@/lib/api/base-url";
import type { GetMe200 } from "@/lib/api/generated/http/schemas/me-api";
import { buildAuthSessionCookieHeader } from "@/lib/auth/request-cookies";
import { parseServerMeResponse } from "@/lib/users/server-me-response";

export async function getServerMe(): Promise<GetMe200 | null> {
  const requestCookies = await cookies();
  const cookieHeader = buildAuthSessionCookieHeader(requestCookies);

  if (!cookieHeader) {
    return null;
  }

  try {
    const response = await fetch(`${getAppApiBaseURL()}/me`, {
      cache: "no-store",
      headers: {
        cookie: cookieHeader,
      },
    });

    return await parseServerMeResponse(response);
  } catch {
    return null;
  }
}
