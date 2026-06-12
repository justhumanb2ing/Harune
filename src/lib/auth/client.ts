import { dodopaymentsClient } from "@dodopayments/better-auth";
import { createAuthClient } from "better-auth/react";
import { getAppApiBaseURL } from "@/lib/api/base-url";

export function getAuthClientBaseURL() {
  return getAppApiBaseURL();
}

export const authClient = createAuthClient({
  baseURL: getAuthClientBaseURL(),
  basePath: "/auth",
  fetchOptions: {
    credentials: "include",
  },
  plugins: [dodopaymentsClient()],
});
