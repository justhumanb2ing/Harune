import { createAuthClient } from "better-auth/react";
import { env } from "@/env";

const baseURL =
  env.NEXT_PUBLIC_AUTH_URL ??
  env.NEXT_PUBLIC_API_BASE_URL ??
  (process.env.NODE_ENV === "development" ? "http://localhost:8787" : "https://api.harune.me");

export const authClient = createAuthClient({
  baseURL: baseURL.replace(/\/$/, ""),
  basePath: "/auth",
  fetchOptions: {
    credentials: "include",
  },
});
