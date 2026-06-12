import type { ProfileBentoItem, ProfileMediaType } from "@/lib/profile/types";

export type PendingProfileBentoMediaUpload = {
  file: File;
  uploaded: boolean;
  contentHash?: string;
  contentType?: string;
  mediaType?: ProfileMediaType;
  tempObjectKey?: string;
  tempUrl?: string;
  uploadUrl?: string;
};

export type PendingProfileBentoMediaUploadsById = Record<string, PendingProfileBentoMediaUpload>;

export const materializePendingProfileBentoMediaUploads = (
  items: ProfileBentoItem[],
  uploadsById: PendingProfileBentoMediaUploadsById
): ProfileBentoItem[] =>
  items.map((item) => {
    if (item.type !== "media") {
      return item;
    }

    const upload = uploadsById[item.id];

    if (!upload) {
      return item;
    }

    if (
      !upload.uploaded ||
      !upload.contentHash ||
      !upload.contentType ||
      !upload.mediaType ||
      !upload.tempObjectKey ||
      !upload.tempUrl
    ) {
      return item;
    }

    return {
      ...item,
      content: {
        ...item.content,
        contentHash: upload.contentHash,
        contentType: upload.contentType,
        mediaType: upload.mediaType,
        objectKey: upload.tempObjectKey,
        tempObjectKey: upload.tempObjectKey,
        url: upload.tempUrl,
      },
    };
  });
