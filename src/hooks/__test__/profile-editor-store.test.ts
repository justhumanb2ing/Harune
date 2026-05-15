import { afterEach, describe, expect, test } from "bun:test";

import { createProfilePageEditorStore } from "@/hooks/profile-editor-store";
import type { ProfilePageData } from "@/lib/profile/types";

const baseProfilePageData: ProfilePageData = {
  page: {
    id: "page-1",
    handle: "harune",
    location: "Seoul",
    name: "Harune",
    role: "Creator",
    bio: "Bio",
    image: "https://cdn.harune.me/public/users/user-1/profile/profile?v=base",
    imageCrop: null,
    backgroundImage: null,
  },
};

const originalCreateObjectURL = URL.createObjectURL;
const originalRevokeObjectURL = URL.revokeObjectURL;

afterEach(() => {
  URL.createObjectURL = originalCreateObjectURL;
  URL.revokeObjectURL = originalRevokeObjectURL;
});

describe("profile editor image crop store", () => {
  test("keeps the original image file while updating only the crop metadata", () => {
    let counter = 0;
    const revokedUrls: string[] = [];

    URL.createObjectURL = (() => `blob:mock-${++counter}`) as typeof URL.createObjectURL;
    URL.revokeObjectURL = ((url: string) => {
      revokedUrls.push(url);
    }) as typeof URL.revokeObjectURL;

    const store = createProfilePageEditorStore(baseProfilePageData);
    const originalFile = new File(["original"], "profile.png", { type: "image/png" });

    store.actions.selectImage(originalFile);
    const afterSelect = store.getState();

    store.actions.applyProfileImageCrop({
      croppedAreaPixels: {
        x: 12,
        y: 18,
        width: 128,
        height: 128,
      },
    });

    const afterCrop = store.getState();

    expect(afterSelect.previewImageUrl).toBe("blob:mock-1");
    expect(afterSelect.draftData?.page.imageCrop).toBeNull();
    expect(afterCrop.previewImageUrl).toBe("blob:mock-1");
    expect(afterCrop.pendingImageFile).toBe(originalFile);
    expect(afterCrop.draftData?.page.imageCrop?.croppedAreaPixels).toEqual({
      x: 12,
      y: 18,
      width: 128,
      height: 128,
    });
    expect(revokedUrls).toEqual([]);
  });
});
