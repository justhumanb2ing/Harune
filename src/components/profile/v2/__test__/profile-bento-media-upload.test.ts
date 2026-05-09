import { describe, expect, test } from "bun:test";

import { createAutoBentoItem } from "@/components/profile/v2/profile-bento-grid-model";
import {
  materializePendingProfileBentoMediaUploads,
  type PendingProfileBentoMediaUploadsById,
} from "@/components/profile/v2/profile-bento-media-upload";
import type { ProfileBentoItem } from "@/lib/profile/types";

describe("profile-bento-media-upload", () => {
  test("materializes queued media uploads into the save payload", () => {
    const mediaItem = {
      ...createAutoBentoItem("media", []),
      content: {
        alt: "Selected image",
        caption: "Caption",
        href: null,
        mediaType: "image" as const,
        objectKey: "",
        url: "blob:preview-url",
      },
    } as Extract<ProfileBentoItem, { type: "media" }>;

    const textItem = createAutoBentoItem("text", [mediaItem]);
    const uploadUrl = "https://upload.example.com/media";
    const tempUrl = "https://cdn.example.com/public/users/u/profile/bento/media?v=hash";
    const uploadsById: PendingProfileBentoMediaUploadsById = {
      [mediaItem.id]: {
        contentHash: "hash",
        contentType: "image/png",
        file: new File(["file"], "image.png", { type: "image/png" }),
        mediaType: "image",
        tempObjectKey: "public/users/u/bento/media",
        tempUrl,
        uploadUrl,
        uploaded: true,
      },
    };

    const result = materializePendingProfileBentoMediaUploads([mediaItem, textItem], uploadsById);

    expect(result[0]).toEqual({
      ...mediaItem,
      content: {
        ...mediaItem.content,
        contentHash: "hash",
        contentType: "image/png",
        mediaType: "image",
        objectKey: "public/users/u/bento/media",
        tempObjectKey: "public/users/u/bento/media",
        url: tempUrl,
      },
    });
    expect(result[1]).toEqual(textItem);
  });
});
