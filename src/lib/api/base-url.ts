import { env } from "@/env";

const normalizeUrl = (value: string) => value.replace(/\/+$/, "");

export function getAppApiBaseURL() {
  return normalizeUrl(env.NEXT_PUBLIC_API_BASE_URL);
}
