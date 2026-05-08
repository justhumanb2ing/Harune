import { env } from "@/env";
import { appConfig } from "@/lib/config";

const normalizeUrl = (value: string) => value.replace(/\/+$/, "");

export function getAppApiBaseURL() {
  return `${normalizeUrl(env.NEXT_PUBLIC_APP_URL || appConfig.url)}/api`;
}
