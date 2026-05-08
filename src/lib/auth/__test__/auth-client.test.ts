import { describe, expect, test } from "bun:test";

import { getAuthClientBaseURL } from "@/lib/auth-client";

describe("auth client config", () => {
  test("uses the app-origin api proxy base URL", () => {
    expect(getAuthClientBaseURL()).toBe("https://harune.me/api");
  });
});
