import type { Hono, Schema } from "hono";
import type { ApiBindings } from "@/lib/api/hono-factory";
import { apiFactory } from "@/lib/api/hono-factory";

type HonoApiApp = Hono<ApiBindings, Schema, string>;

export const createServerApi = <
  AppApi extends HonoApiApp,
  AuthApi extends HonoApiApp,
  ProfileApi extends HonoApiApp,
  RootApi extends HonoApiApp,
>({
  appApi: appRoutes,
  authApi: authRoutes,
  profileApi: profileRoutes,
  rootApi: rootRoutes,
}: {
  appApi: AppApi;
  authApi: AuthApi;
  profileApi: ProfileApi;
  rootApi: RootApi;
}) =>
  apiFactory
    .createApp()
    .route("/", authRoutes)
    .route("/api/profile", profileRoutes)
    .route("/", rootRoutes)
    .route("/api", appRoutes);
