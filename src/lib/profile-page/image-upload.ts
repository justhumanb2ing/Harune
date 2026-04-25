export const PROFILE_IMAGE_UPLOAD_ROUTE = "/api/app/profile-page/upload-image";
export const PROFILE_IMAGE_MAX_SIZE_BYTES = 5 * 1024 * 1024;
export const PROFILE_IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,image/avif";

export const PROFILE_IMAGE_KINDS = ["profile", "background"] as const;

export type ProfileImageKind = (typeof PROFILE_IMAGE_KINDS)[number];

const PROFILE_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
const PROFILE_IMAGE_KIND_SET = new Set<string>(PROFILE_IMAGE_KINDS);

const extensionByType: Record<string, string> = {
  "image/avif": "avif",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export function getProfileImageFileError(file: Pick<File, "size" | "type">) {
  if (!PROFILE_IMAGE_TYPES.has(file.type)) {
    return "Upload a JPEG, PNG, WebP, or AVIF image.";
  }

  if (file.size > PROFILE_IMAGE_MAX_SIZE_BYTES) {
    return "Image must be 5MB or smaller.";
  }

  return null;
}

export function getProfileImageExtension(fileName: string, fileType: string) {
  const fileExtension = fileName.split(".").pop()?.toLowerCase();

  if (fileExtension && ["avif", "jpeg", "jpg", "png", "webp"].includes(fileExtension)) {
    return fileExtension === "jpeg" ? "jpg" : fileExtension;
  }

  return extensionByType[fileType] ?? "jpg";
}

export function getProfileImageKind(value: unknown): ProfileImageKind | null {
  return typeof value === "string" && PROFILE_IMAGE_KIND_SET.has(value)
    ? (value as ProfileImageKind)
    : null;
}

export function getProfileImageObjectKey(userId: string, kind: ProfileImageKind) {
  return `public/users/${userId}/profile-page/${kind}`;
}

export function withProfileImageCacheVersion(publicUrl: string, version: string) {
  const url = new URL(publicUrl);
  url.searchParams.set("v", version);
  return url.toString();
}

export function getProfileImageCacheVersion(publicUrl: string | null | undefined) {
  if (!publicUrl) {
    return null;
  }

  try {
    return new URL(publicUrl).searchParams.get("v");
  } catch {
    return null;
  }
}
