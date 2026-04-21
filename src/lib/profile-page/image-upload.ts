export const PROFILE_IMAGE_UPLOAD_ROUTE = "/api/app/profile-page/upload-image";
export const PROFILE_IMAGE_MAX_SIZE_BYTES = 5 * 1024 * 1024;
export const PROFILE_IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,image/avif";

const PROFILE_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);

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
