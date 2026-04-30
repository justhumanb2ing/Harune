export function getSafeRedirectPath(value?: string) {
  if (!value?.startsWith("/") || value.startsWith("//")) {
    return "/app";
  }

  return unwrapJoinRedirectPath(value);
}

export function resolveAppRedirectPath(path: string, handle: string) {
  if (path === "/app") {
    return `/v1/${handle}/app`;
  }

  if (path.startsWith("/app/")) {
    return `/v1/${handle}${path}`;
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

  return `/v1/${handle}/${area}${restPath}${suffix}`;
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
