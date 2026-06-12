import { describe, expect, test } from "bun:test";

import { getAuthClientBaseURL } from "@/lib/auth/client";

describe("auth client config", () => {
  test("uses the backend api base URL", () => {
    expect(getAuthClientBaseURL()).toBe("http://localhost:8787");
  });

  test("allows server runtime to use a private api origin", async () => {
    const previous = process.env.SERVER_API_BASE_URL;

    process.env.SERVER_API_BASE_URL = "https://server.example.workers.dev";

    const { getAppApiBaseURL } = await import("@/lib/api/base-url");

    expect(getAppApiBaseURL()).toBe("https://server.example.workers.dev");

    if (previous === undefined) {
      delete process.env.SERVER_API_BASE_URL;
    } else {
      process.env.SERVER_API_BASE_URL = previous;
    }
  });
});
