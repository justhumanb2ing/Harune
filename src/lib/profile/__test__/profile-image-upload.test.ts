import { describe, expect, test } from "bun:test";

import { getFileSha256Hex, uploadProfileImageIfChanged } from "@/lib/profile/client-image-upload";
import {
  getProfileImageCacheVersion,
  getProfileImageObjectKey,
  withProfileImageCacheVersion,
} from "@/lib/profile/image-upload";

describe("profile image upload", () => {
  test("uses one stable storage key for each user image kind", () => {
    expect(getProfileImageObjectKey("user-1", "profile")).toBe(
      "public/users/user-1/profile/profile"
    );
    expect(getProfileImageObjectKey("user-1", "background")).toBe(
      "public/users/user-1/profile/background"
    );
  });

  test("stores the content hash as the public URL cache version", () => {
    const versionedUrl = withProfileImageCacheVersion(
      "https://storage.example.com/public/users/user-1/profile/profile",
      "abc123"
    );

    expect(getProfileImageCacheVersion(versionedUrl)).toBe("abc123");
  });

  test("skips uploading when the selected file already matches the stored hash", async () => {
    const file = new File(["same-image"], "profile.png", { type: "image/png" });
    const imageHash = await getFileSha256Hex(file);
    const currentUrl = withProfileImageCacheVersion(
      "https://storage.example.com/public/users/user-1/profile/profile",
      imageHash
    );
    const originalFetch = globalThis.fetch;
    let fetchCount = 0;
    globalThis.fetch = ((input, init) => {
      fetchCount += 1;
      return originalFetch(input, init);
    }) as typeof fetch;

    let uploadedUrl: string | null = null;
    try {
      uploadedUrl = await uploadProfileImageIfChanged({
        currentUrl,
        file,
        kind: "profile",
      });
    } finally {
      globalThis.fetch = originalFetch;
    }

    expect(uploadedUrl).toBe(currentUrl);
    expect(fetchCount).toBe(0);
  });

  test("finalizes changed uploads so the profile image column is persisted", async () => {
    const file = new File(["changed-image"], "background.png", { type: "image/png" });
    const finalizedUrl =
      "https://storage.example.com/public/users/user-1/profile/background?v=final";
    const fetchCalls: Array<{ init?: RequestInit; input: RequestInfo | URL }> = [];
    const originalFetch = globalThis.fetch;

    globalThis.fetch = ((input, init) => {
      fetchCalls.push({ input, init });

      if (String(input).includes("/profile/image") && init?.method === "POST") {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              imageUrl:
                "https://storage.example.com/public/users/user-1/profile/background?v=uploaded",
            }),
            {
              headers: {
                "content-type": "application/json",
              },
            }
          )
        );
      }

      return Promise.resolve(
        new Response(
          JSON.stringify({
            imageUrl: finalizedUrl,
          }),
          {
            headers: {
              "content-type": "application/json",
            },
          }
        )
      );
    }) as typeof fetch;

    let uploadedUrl: string | null = null;
    try {
      uploadedUrl = await uploadProfileImageIfChanged({
        currentUrl: null,
        file,
        kind: "background",
      });
    } finally {
      globalThis.fetch = originalFetch;
    }

    const finalizeBody = JSON.parse(String(fetchCalls[1]?.init?.body)) as {
      imageKind: string;
      imageUrl: string;
    };

    expect(uploadedUrl).toBe(finalizedUrl);
    expect(fetchCalls.length).toBe(2);
    expect(String(fetchCalls[1]?.input)).toContain("/profile/image");
    expect(fetchCalls[1]?.init?.method).toBe("PATCH");
    expect(finalizeBody.imageKind).toBe("background");
    expect(finalizeBody.imageUrl.includes("/profile/background?v=")).toBe(true);
  });
});
