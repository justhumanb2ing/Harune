export const toRootApiRequest = (req: Request) => {
  const url = new URL(req.url);

  if (url.pathname.length > 1) {
    url.pathname = url.pathname.replace(/\/+$/, "");
  }

  return new Request(url, req);
};
