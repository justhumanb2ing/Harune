import { env } from "@/env";

const normalizeUrl = (value: string) => value.replace(/\/+$/, "");

export function getAppApiBaseURL() {
  if (typeof window === "undefined" && process.env.SERVER_API_BASE_URL) {
    return normalizeUrl(process.env.SERVER_API_BASE_URL);
  }

  return normalizeUrl(env.NEXT_PUBLIC_API_BASE_URL);
}
