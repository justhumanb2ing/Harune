import type { MeResponse } from "@/lib/api/app/types";

function normalizeCtaPath(value?: string) {
  if (!value?.startsWith("/") || value.startsWith("//")) {
    return "/";
  }

  const [pathname] = value.split("?");

  if (pathname === "/app" || pathname.startsWith("/app/")) {
    return "/";
  }

  return value;
}

export function createSignInCallbackHref(next = "/") {
  const callbackUrl = normalizeCtaPath(next);
  return `/sign-in?callbackUrl=${encodeURIComponent(callbackUrl)}`;
}

export function resolveAppEntryHref(input: {
  next?: string;
  profilePage: MeResponse["profilePage"];
}) {
  const handle = input.profilePage?.handle;

  if (!handle) {
    return "/create";
  }

  const safeNext = normalizeCtaPath(input.next);

  if (safeNext.startsWith(`/${handle}/analytics`)) {
    return safeNext;
  }

  return `/${handle}`;
}
