"use client";

import { hc } from "hono/client";
import type { RootApi } from "@/lib/api/root/app";
import type { ServerApi } from "@/server";

export const apiClient = hc<ServerApi>("/", {
  init: {
    credentials: "include",
  },
});

export const rootApiClient = hc<RootApi>("/", {
  init: {
    credentials: "include",
  },
});
