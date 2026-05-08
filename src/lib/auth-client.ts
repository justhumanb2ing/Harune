import { createAuthClient } from "better-auth/react";
import { env } from "@/env";

export function getAuthClientBaseURL(apiBaseURL = env.NEXT_PUBLIC_API_BASE_URL) {
  return apiBaseURL.replace(/\/$/, "");
}

export const authClient = createAuthClient({
  baseURL: getAuthClientBaseURL(),
  basePath: "/auth",
  fetchOptions: {
    credentials: "include",
  },
});
