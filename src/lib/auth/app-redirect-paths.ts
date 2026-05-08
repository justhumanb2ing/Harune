export function getSafeRedirectPath(value?: string) {
  if (!value?.startsWith("/") || value.startsWith("//")) {
    return "/app";
  }

  return unwrapJoinRedirectPath(value);
}

export function resolveAppRedirectPath(path: string, handle: string) {
  const [pathname, search = ""] = path.split("?");
  const suffix = search ? `?${search}` : "";

  if (pathname === "/app" || pathname.startsWith("/app/")) {
    return `/${handle}${suffix}`;
  }

  const legacyHandleAppPath = resolveLegacyHandleAppPath(path);

  if (legacyHandleAppPath) {
    return legacyHandleAppPath;
  }

  return path;
}

function resolveLegacyHandleAppPath(path: string) {
  const [pathname, search = ""] = path.split("?");
  const segments = pathname.split("/").filter(Boolean);
  const [handle, area, ...restSegments] = segments;

  if (!handle || (area !== "app" && area !== "analytics")) {
    return null;
  }

  const restPath = restSegments.length > 0 ? `/${restSegments.join("/")}` : "";
  const suffix = search ? `?${search}` : "";

  if (area === "analytics") {
    return `/${handle}/analytics${restPath}${suffix}`;
  }

  return `/${handle}${suffix}`;
}

function unwrapJoinRedirectPath(value: string) {
  let currentValue = value;

  while (true) {
    const currentUrl = new URL(currentValue, "https://leeve.test");

    if (currentUrl.pathname !== "/api/join") {
      return currentValue;
    }

    const nextValue = currentUrl.searchParams.get("next");

    if (!nextValue?.startsWith("/") || nextValue.startsWith("//")) {
      return "/app";
    }

    currentValue = nextValue;
  }
}
