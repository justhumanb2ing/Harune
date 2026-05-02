const PROFILE_PAGE_API_PREFIX = "/api/app/profile-page";

export const toProfilePageApiRequest = (req: Request) => {
  const url = new URL(req.url);

  if (url.pathname === PROFILE_PAGE_API_PREFIX) {
    url.pathname = "/";
  } else if (url.pathname.startsWith(`${PROFILE_PAGE_API_PREFIX}/`)) {
    url.pathname = url.pathname.slice(PROFILE_PAGE_API_PREFIX.length);
  }

  if (url.pathname.length > 1) {
    url.pathname = url.pathname.replace(/\/+$/, "");
  }

  return new Request(url, req);
};
