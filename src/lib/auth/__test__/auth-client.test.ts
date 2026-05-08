import { describe, expect, test } from "bun:test";

import { getAuthClientBaseURL } from "@/lib/auth-client";

describe("auth client config", () => {
  test("uses the backend api base URL", () => {
    expect(getAuthClientBaseURL()).toBe("http://localhost:8787");
  });
});
