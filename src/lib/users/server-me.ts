import "server-only";

import { cookies } from "next/headers";
import { env } from "@/env";
import type { GetMe200 } from "@/lib/api/generated/http/schemas/me-api";
import { parseServerMeResponse } from "@/lib/users/server-me-response";

export async function getServerMe(): Promise<GetMe200 | null> {
  const requestCookies = await cookies();
  const cookieHeader = requestCookies.toString();

  if (!cookieHeader) {
    return null;
  }

  try {
    const response = await fetch(`${env.NEXT_PUBLIC_API_BASE_URL}/me`, {
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
