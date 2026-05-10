type CookieLike = {
  name: string;
  value: string;
};

type CookieStoreLike = {
  getAll(): CookieLike[];
};

const AUTH_SESSION_COOKIE_PREFIXES = [
  "better-auth.session_token",
  "__Secure-better-auth.session_token",
  "__Host-better-auth.session_token",
] as const;

const isAuthSessionCookieName = (name: string) =>
  AUTH_SESSION_COOKIE_PREFIXES.some((prefix) => name === prefix || name.startsWith(`${prefix}.`));

export function buildAuthSessionCookieHeader(cookieStore: CookieStoreLike) {
  const sessionCookies = cookieStore
    .getAll()
    .filter((cookie) => isAuthSessionCookieName(cookie.name));

  if (sessionCookies.length === 0) {
    return null;
  }

  return sessionCookies.map((cookie) => `${cookie.name}=${cookie.value}`).join("; ");
}
