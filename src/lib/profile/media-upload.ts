import type { ProfileMediaType } from "@/lib/profile/types";

export const PROFILE_BENTO_MEDIA_UPLOAD_ROUTE = "/api/profile/bento/media/upload";
export const PROFILE_BENTO_MEDIA_MAX_SIZE_BYTES = 5 * 1024 * 1024;

export const PROFILE_BENTO_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
export const PROFILE_BENTO_VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];
export const PROFILE_BENTO_MEDIA_ACCEPT = [
  ...PROFILE_BENTO_IMAGE_TYPES,
  ...PROFILE_BENTO_VIDEO_TYPES,
].join(",");

export const getProfileBentoMediaType = (mimeType: string): ProfileMediaType | null => {
  if (PROFILE_BENTO_IMAGE_TYPES.includes(mimeType)) {
    return "image";
  }

  if (PROFILE_BENTO_VIDEO_TYPES.includes(mimeType)) {
    return "video";
  }

  return null;
};

export const getProfileBentoMediaFileError = (file: File) => {
  if (!getProfileBentoMediaType(file.type)) {
    return "이미지 또는 비디오 파일만 추가할 수 있어요.";
  }

  if (file.size > PROFILE_BENTO_MEDIA_MAX_SIZE_BYTES) {
    return "이미지와 비디오는 5MB 이하만 추가할 수 있어요.";
  }

  return null;
};

export const getProfileBentoMediaHash = async (file: File) => {
  const hashBuffer = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());

  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
};
