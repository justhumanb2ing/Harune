import type { ProfileImageCrop } from "@/lib/profile/types";

export type ImageSize = {
  height: number;
  width: number;
};

const DEFAULT_OBJECT_POSITION = "50% 50%";

function clampPercentage(value: number) {
  return Math.min(100, Math.max(0, value));
}

function getCropAxisPosition(cropOffset: number, cropSize: number, naturalSize: number) {
  const overflow = naturalSize - cropSize;

  if (overflow <= 0) {
    return 50;
  }

  return clampPercentage((cropOffset / overflow) * 100);
}

export function getProfileImageObjectPosition(
  imageCrop: ProfileImageCrop | null | undefined,
  naturalSize: ImageSize | null | undefined
) {
  if (!imageCrop || !naturalSize?.width || !naturalSize?.height) {
    return DEFAULT_OBJECT_POSITION;
  }

  const { croppedAreaPixels } = imageCrop;
  const x = getCropAxisPosition(croppedAreaPixels.x, croppedAreaPixels.width, naturalSize.width);
  const y = getCropAxisPosition(croppedAreaPixels.y, croppedAreaPixels.height, naturalSize.height);

  return `${x}% ${y}%`;
}
