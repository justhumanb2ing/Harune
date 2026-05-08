import { describe, expect, test } from "bun:test";

import { getAuthClientBaseURL } from "@/lib/auth-client";

describe("auth client config", () => {
  test("trims trailing slashes from the API base URL", () => {
    expect(getAuthClientBaseURL("https://api.harune.me/")).toBe("https://api.harune.me");
  });
});
