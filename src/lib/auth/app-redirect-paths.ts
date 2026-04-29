export function getSafeRedirectPath(value?: string) {
  if (!value?.startsWith("/") || value.startsWith("//")) {
    return "/app";
  }

  return unwrapJoinRedirectPath(value);
}

export function resolveAppRedirectPath(path: string, handle: string) {
  if (path === "/app") {
    return `/${handle}/app`;
  }

  if (path.startsWith("/app/")) {
    return `/${handle}${path}`;
  }

  return path;
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
