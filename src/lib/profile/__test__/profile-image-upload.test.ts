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
    const presignedUrl =
      "https://storage.example.com/public/users/user-1/profile/background?v=uploaded";
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
              contentLength: file.size,
              contentType: file.type,
              expiresAt: "2026-05-08T02:00:00.000Z",
              imageHash: "hash",
              imageKind: "background",
              imageUrl: presignedUrl,
              objectKey: "public/users/user-1/profile/background",
              uploadUrl: "https://upload.example.com/background",
            }),
            {
              headers: {
                "content-type": "application/json",
              },
            }
          )
        );
      }

      if (String(input) === "https://upload.example.com/background" && init?.method === "PUT") {
        return Promise.resolve(new Response(null, { status: 200 }));
      }

      if (String(input).includes("/profile/image") && init?.method === "PATCH") {
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
      }

      return Promise.resolve(
        new Response(null, {
          status: 500,
        })
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
    expect(String(fetchCalls[1]?.input)).toBe("https://upload.example.com/background");
    expect(fetchCalls[1]?.init?.method).toBe("PUT");
    expect(fetchCalls[2]?.init?.method).toBe("PATCH");
    expect(finalizeBody.imageKind).toBe("background");
    expect(finalizeBody.imageUrl.includes("/profile/background?v=")).toBe(true);
  });

  test("returns the uploaded url without finalizing when persistence is disabled", async () => {
    const file = new File(["preview-image"], "profile.png", { type: "image/png" });
    const presignedUrl =
      "https://storage.example.com/public/users/user-1/profile/profile?v=uploaded";
    const fetchCalls: Array<{ init?: RequestInit; input: RequestInfo | URL }> = [];
    const originalFetch = globalThis.fetch;

    globalThis.fetch = ((input, init) => {
      fetchCalls.push({ input, init });

      if (String(input).includes("/profile/image") && init?.method === "POST") {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              contentLength: file.size,
              contentType: file.type,
              expiresAt: "2026-05-08T02:00:00.000Z",
              imageHash: "hash",
              imageKind: "profile",
              imageUrl: presignedUrl,
              objectKey: "public/users/user-1/profile/profile",
              uploadUrl: "https://upload.example.com/profile",
            }),
            {
              headers: {
                "content-type": "application/json",
              },
            }
          )
        );
      }

      if (String(input) === "https://upload.example.com/profile" && init?.method === "PUT") {
        return Promise.resolve(new Response(null, { status: 200 }));
      }

      return Promise.resolve(new Response(null, { status: 500 }));
    }) as typeof fetch;

    let resultUrl: string | null = null;
    try {
      resultUrl = await uploadProfileImageIfChanged({
        currentUrl: null,
        file,
        kind: "profile",
        persist: false,
      });
    } finally {
      globalThis.fetch = originalFetch;
    }

    expect(resultUrl).toBe(presignedUrl);
    expect(fetchCalls.length).toBe(2);
    expect(fetchCalls[0]?.init?.method).toBe("POST");
    expect(fetchCalls[1]?.init?.method).toBe("PUT");
  });
});
