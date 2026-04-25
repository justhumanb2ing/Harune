import { describe, expect, test } from "bun:test";

import {
  getFileSha256Hex,
  uploadProfileImageIfChanged,
} from "@/lib/profile-page/client-image-upload";
import {
  getProfileImageCacheVersion,
  getProfileImageObjectKey,
  withProfileImageCacheVersion,
} from "@/lib/profile-page/image-upload";

describe("profile image upload", () => {
  test("uses one stable storage key for each user image kind", () => {
    expect(getProfileImageObjectKey("user-1", "profile")).toBe(
      "public/users/user-1/profile-page/profile"
    );
    expect(getProfileImageObjectKey("user-1", "background")).toBe(
      "public/users/user-1/profile-page/background"
    );
  });

  test("stores the content hash as the public URL cache version", () => {
    const versionedUrl = withProfileImageCacheVersion(
      "https://storage.example.com/public/users/user-1/profile-page/profile",
      "abc123"
    );

    expect(getProfileImageCacheVersion(versionedUrl)).toBe("abc123");
  });

  test("skips uploading when the selected file already matches the stored hash", async () => {
    const file = new File(["same-image"], "profile.png", { type: "image/png" });
    const imageHash = await getFileSha256Hex(file);
    const currentUrl = withProfileImageCacheVersion(
      "https://storage.example.com/public/users/user-1/profile-page/profile",
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
      "https://storage.example.com/public/users/user-1/profile-page/background?v=final";
    const fetchCalls: Array<{ init?: RequestInit; input: RequestInfo | URL }> = [];
    const originalFetch = globalThis.fetch;

    globalThis.fetch = ((input, init) => {
      fetchCalls.push({ input, init });

      if (input === "/api/app/profile-page/upload-image" && init?.method === "POST") {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              fields: {
                key: "public/users/user-1/profile-page/background",
              },
              publicUrl:
                "https://storage.example.com/public/users/user-1/profile-page/background?v=uploaded",
              url: "https://storage.example.com",
            }),
            {
              headers: {
                "content-type": "application/json",
              },
            }
          )
        );
      }

      if (input === "https://storage.example.com") {
        return Promise.resolve(new Response(null));
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

    const finalizeBody = JSON.parse(String(fetchCalls[2]?.init?.body)) as {
      imageKind: string;
      imageUrl: string;
    };

    expect(uploadedUrl).toBe(finalizedUrl);
    expect(fetchCalls.length).toBe(3);
    expect(fetchCalls[2]?.input).toBe("/api/app/profile-page/upload-image");
    expect(fetchCalls[2]?.init?.method).toBe("PATCH");
    expect(finalizeBody.imageKind).toBe("background");
    expect(finalizeBody.imageUrl.includes("/profile-page/background?v=")).toBe(true);
  });
});
