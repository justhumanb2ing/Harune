import { env } from "@/env";
import { appConfig } from "@/lib/config";

export function getAppOrigin() {
  return (env.NEXT_PUBLIC_APP_URL ?? appConfig.url).replace(/\/$/, "");
}

export function resolveAbsoluteAppUrl(path: string, appOrigin = getAppOrigin()) {
  return new URL(path, appOrigin).toString();
}

export function getAppUrl(path = "/") {
  return resolveAbsoluteAppUrl(path);
}
