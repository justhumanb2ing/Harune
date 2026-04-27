export function getSafeRedirectPath(value?: string) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/app";
  }

  return value;
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
