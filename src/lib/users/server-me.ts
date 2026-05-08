import "server-only";

import { cookies } from "next/headers";
import { env } from "@/env";
import type { GetMe200 } from "@/lib/api/generated/http/schemas/me-api";

export async function getServerMe(): Promise<GetMe200 | null> {
  const requestCookies = await cookies();
  const cookieHeader = requestCookies.toString();

  if (!cookieHeader) {
    return null;
  }

  const response = await fetch(`${env.NEXT_PUBLIC_API_BASE_URL}/me`, {
    cache: "no-store",
    headers: {
      cookie: cookieHeader,
    },
  });

  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Failed to load current user: ${response.status}`);
  }

  return (await response.json()) as GetMe200;
}
