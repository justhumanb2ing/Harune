import { createAuthClient } from "better-auth/react";

const baseURL =
  process.env.NODE_ENV === "development" ? "http://localhost:8787" : "https://api.harune.me";

export const authClient = createAuthClient({
  baseURL,
  basePath: "/auth",
  fetchOptions: {
    credentials: "include",
  },
});
