import type { ProfileImageCrop } from "@/lib/profile/types";

export type ImageSize = {
  height: number;
  width: number;
};

export type ProfileImageCropFrameStyle = {
  height: string;
  left: string;
  top: string;
  width: string;
};

export function getLoadedImageSize(
  image: Pick<HTMLImageElement, "complete" | "naturalHeight" | "naturalWidth"> | null | undefined
) {
  if (!image?.complete || !image.naturalWidth || !image.naturalHeight) {
    return null;
  }

  return {
    height: image.naturalHeight,
    width: image.naturalWidth,
  };
}

export function getProfileImageCropFrameStyle(
  imageCrop: ProfileImageCrop | null | undefined,
  naturalSize: ImageSize | null | undefined
) {
  if (!imageCrop || !naturalSize?.width || !naturalSize?.height) {
    return null;
  }

  const { croppedAreaPixels } = imageCrop;
  if (!croppedAreaPixels.width || !croppedAreaPixels.height) {
    return null;
  }

  return {
    height: `${(naturalSize.height / croppedAreaPixels.width) * 100}%`,
    left: `-${(croppedAreaPixels.x / croppedAreaPixels.width) * 100}%`,
    top: `-${(croppedAreaPixels.y / croppedAreaPixels.width) * 100}%`,
    width: `${(naturalSize.width / croppedAreaPixels.width) * 100}%`,
  };
}
