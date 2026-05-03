import type { Hono, Schema } from "hono";
import { type ApiBindings, apiFactory } from "@/lib/api/hono-factory";

type HonoApiApp = Hono<ApiBindings, Schema, string>;

export const createServerApi = <
  AppApi extends HonoApiApp,
  ProfileApi extends HonoApiApp,
  RootApi extends HonoApiApp,
>({
  appApi: appRoutes,
  profileApi: profileRoutes,
  rootApi: rootRoutes,
}: {
  appApi: AppApi;
  profileApi: ProfileApi;
  rootApi: RootApi;
}) =>
  apiFactory
    .createApp()
    .route("/api/profile", profileRoutes)
    .route("/api", appRoutes)
    .route("/", rootRoutes);
