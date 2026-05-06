import "server-only";

import { hc } from "hono/client";
import { cookies, headers } from "next/headers";
import { env } from "@/env";
import type { HonoApp } from "@/lib/api/server";

const getRequestOrigin = async () => {
  if (env.NEXT_PUBLIC_APP_URL) {
    return env.NEXT_PUBLIC_APP_URL;
  }

  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const protocol =
    requestHeaders.get("x-forwarded-proto") ??
    (process.env.NODE_ENV === "production" ? "https" : "http");

  return host ? `${protocol}://${host}` : "http://localhost:3000";
};

export const getServerApiClient = async () => {
  const origin = await getRequestOrigin();

  return hc<HonoApp>(origin, {
    fetch: async (input, reqInit, _env, _executionCtx) => {
      const requestCookies = await cookies();
      const requestHeaders = new Headers(reqInit?.headers);
      const cookieHeader = requestCookies.toString();

      if (cookieHeader) {
        requestHeaders.set("Cookie", cookieHeader);
      }

      return fetch(input, {
        ...reqInit,
        credentials: "include",
        headers: requestHeaders,
      });
    },
  });
};
