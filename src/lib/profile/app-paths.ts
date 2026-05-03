export function getProfileAppPath(handle: string) {
  return `/${handle}`;
}

export function getProfileAnalyticsPath(handle: string) {
  return `/${handle}/analytics`;
}

export function getProfileRouteHandle(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);

  return segments[0] ?? "";
}

export function replaceProfileRouteHandle(pathname: string, handle: string) {
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) {
    return getProfileAppPath(handle);
  }

  return `/${[handle, ...segments.slice(1)].join("/")}`;
}
