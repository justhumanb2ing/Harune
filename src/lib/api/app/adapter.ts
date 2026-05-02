const APP_API_PREFIX = "/api/app";

export const toAppApiRequest = (req: Request) => {
  const url = new URL(req.url);

  if (url.pathname === APP_API_PREFIX) {
    url.pathname = "/";
  } else if (url.pathname.startsWith(`${APP_API_PREFIX}/`)) {
    url.pathname = url.pathname.slice(APP_API_PREFIX.length);
  }

  if (url.pathname.length > 1) {
    url.pathname = url.pathname.replace(/\/+$/, "");
  }

  return new Request(url, req);
};
