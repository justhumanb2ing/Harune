const PROFILE_APP_VERSION_SEGMENT = "v1";
const PROFILE_PUBLIC_VERSION_SEGMENT = "v2";

export function getProfileAppPath(handle: string, suffix = "") {
  return `/${PROFILE_APP_VERSION_SEGMENT}/${handle}/app${suffix}`;
}

export function getProfileAnalyticsPath(handle: string) {
  return `/${PROFILE_APP_VERSION_SEGMENT}/${handle}/analytics`;
}

export function getProfileRouteHandle(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);

  if (
    segments[0] === PROFILE_APP_VERSION_SEGMENT ||
    segments[0] === PROFILE_PUBLIC_VERSION_SEGMENT
  ) {
    return segments[1] ?? "";
  }

  return segments[0] ?? "";
}

export function replaceProfileRouteHandle(pathname: string, handle: string) {
  const segments = pathname.split("/").filter(Boolean);

  if (segments[0] === PROFILE_APP_VERSION_SEGMENT) {
    return `/${[PROFILE_APP_VERSION_SEGMENT, handle, ...segments.slice(2)].join("/")}`;
  }

  if (segments.length === 0) {
    return getProfileAppPath(handle);
  }

  return `/${[PROFILE_APP_VERSION_SEGMENT, handle, ...segments.slice(1)].join("/")}`;
}
