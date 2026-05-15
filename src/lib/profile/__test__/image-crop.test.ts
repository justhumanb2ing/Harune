import { describe, expect, test } from "bun:test";

import { resolveCropImageSource } from "@/lib/profile/image-crop";

describe("image crop source resolution", () => {
  test("proxies external image urls through the same-origin image proxy", () => {
    expect(
      resolveCropImageSource(
        "https://cdn.harune.me/public/users/U2LgC7hcSwpo9ouuZpf7pXEe0W4Xj7ks/profile?v=abc",
        "http://localhost:3000"
      )
    ).toBe(
      "/api/profile/image-proxy?url=https%3A%2F%2Fcdn.harune.me%2Fpublic%2Fusers%2FU2LgC7hcSwpo9ouuZpf7pXEe0W4Xj7ks%2Fprofile%3Fv%3Dabc"
    );
  });

  test("keeps blob and data urls untouched", () => {
    expect(resolveCropImageSource("blob:http://localhost:3000/123", "http://localhost:3000")).toBe(
      "blob:http://localhost:3000/123"
    );
    expect(resolveCropImageSource("data:image/png;base64,abc", "http://localhost:3000")).toBe(
      "data:image/png;base64,abc"
    );
  });

  test("keeps same-origin urls untouched", () => {
    expect(
      resolveCropImageSource("/api/profile/image-proxy?url=test", "http://localhost:3000")
    ).toBe("/api/profile/image-proxy?url=test");
  });
});
