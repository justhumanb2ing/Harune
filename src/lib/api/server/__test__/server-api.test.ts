import { describe, expect, test } from "bun:test";
import { apiFactory } from "@/lib/api/hono-factory";
import { createServerApi } from "@/lib/api/server/create-server-api";

describe("server Hono API", () => {
  test("routes profile requests before the broader app API", async () => {
    const rootApi = apiFactory.createApp().get("/metadata", (context) => context.text("root"));
    const authApi = apiFactory.createApp().get("/api/auth/ok", (context) => context.text("auth"));
    const appApi = apiFactory.createApp().get("/profile/sync", (context) => {
      return context.text("app");
    });
    const profileApi = apiFactory.createApp().get("/sync", (context) => {
      return context.text("profile");
    });
    const serverApi = createServerApi({ appApi, authApi, profileApi, rootApi });

    const profileResponse = await serverApi.request("/api/profile/sync");

    expect(await profileResponse.text()).toBe("profile");
  });

  test("routes app and root requests through the same server catch-all app", async () => {
    const rootApi = apiFactory.createApp().get("/metadata", (context) => context.text("root"));
    const authApi = apiFactory.createApp().get("/api/auth/ok", (context) => context.text("auth"));
    const appApi = apiFactory.createApp().get("/me", (context) => context.text("app"));
    const profileApi = apiFactory.createApp().get("/", (context) => {
      return context.text("profile");
    });
    const serverApi = createServerApi({ appApi, authApi, profileApi, rootApi });

    const appResponse = await serverApi.request("/api/me");
    const rootResponse = await serverApi.request("/metadata");

    expect(await appResponse.text()).toBe("app");
    expect(await rootResponse.text()).toBe("root");
  });

  test("routes Better Auth requests through the Hono server before the broader app API", async () => {
    const rootApi = apiFactory.createApp().get("/api/auth/ok", (context) => context.text("root"));
    const authApi = apiFactory.createApp().get("/api/auth/ok", (context) => context.text("auth"));
    const appApi = apiFactory.createApp().get("/auth/ok", (context) => context.text("app"));
    const profileApi = apiFactory.createApp();
    const serverApi = createServerApi({ appApi, authApi, profileApi, rootApi });

    const authResponse = await serverApi.request("/api/auth/ok");

    expect(await authResponse.text()).toBe("auth");
  });
});
