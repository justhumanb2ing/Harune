"use client";

import { hc } from "hono/client";
import type { RootApi } from "@/lib/api/routes/root";
import type { ServerApi } from "@/lib/api/server";

type ApiClient = ReturnType<typeof hc<ServerApi>> & ReturnType<typeof hc<RootApi>>;

export const apiClient = hc<ServerApi>("/", {
  init: {
    credentials: "include",
  },
}) as ApiClient;
