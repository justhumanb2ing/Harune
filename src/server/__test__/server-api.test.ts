import { describe, expect, test } from "bun:test";
import { apiFactory } from "@/lib/api/hono-factory";
import { createServerApi } from "@/server/create-server-api";

describe("server Hono API", () => {
  test("routes profile requests before the broader app API", async () => {
    const rootApi = apiFactory.createApp().get("/api/crawl", (context) => context.text("root"));
    const appApi = apiFactory.createApp().get("/profile/sync", (context) => {
      return context.text("app");
    });
    const profileApi = apiFactory.createApp().get("/sync", (context) => {
      return context.text("profile");
    });
    const serverApi = createServerApi({ appApi, profileApi, rootApi });

    const profileResponse = await serverApi.request("/api/profile/sync");

    expect(await profileResponse.text()).toBe("profile");
  });

  test("routes app and root requests through the same server catch-all app", async () => {
    const rootApi = apiFactory.createApp().get("/api/crawl", (context) => context.text("root"));
    const appApi = apiFactory.createApp().get("/me", (context) => context.text("app"));
    const profileApi = apiFactory.createApp().get("/", (context) => {
      return context.text("profile");
    });
    const serverApi = createServerApi({ appApi, profileApi, rootApi });

    const appResponse = await serverApi.request("/api/me");
    const rootResponse = await serverApi.request("/api/crawl");

    expect(await appResponse.text()).toBe("app");
    expect(await rootResponse.text()).toBe("root");
  });
});
