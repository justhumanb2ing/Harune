"use client";

import { useEffect, useRef, useState } from "react";
import {
  getLoadedImageSize,
  getProfileImageCropFrameStyle,
  type ImageSize,
} from "@/lib/profile/avatar-image";
import type { ProfileImageCrop } from "@/lib/profile/types";
import { cn } from "@/lib/utils";

type ProfileAvatarImageProps = {
  alt: string;
  className?: string;
  imageCrop?: ProfileImageCrop | null;
  src: string;
};

export function ProfileAvatarImage({ alt, className, imageCrop, src }: ProfileAvatarImageProps) {
  const [naturalSize, setNaturalSize] = useState<ImageSize | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!src) {
      setNaturalSize(null);
      return;
    }

    setNaturalSize(null);

    const loadedImageSize = getLoadedImageSize(imageRef.current);

    if (loadedImageSize) {
      setNaturalSize(loadedImageSize);
    }
  }, [src]);

  const cropFrameStyle = getProfileImageCropFrameStyle(imageCrop, naturalSize);
  const isCropPending = Boolean(imageCrop && !cropFrameStyle);

  return (
    <span className={cn("relative block size-full overflow-hidden", className)}>
      {/* biome-ignore lint/performance/noImgElement: user-generated remote/blob avatar image. */}
      <img
        alt={alt}
        className="absolute left-0 top-0 block max-w-none"
        decoding="async"
        fetchPriority="high"
        loading="eager"
        ref={imageRef}
        onLoad={(event) => {
          const loadedImageSize = getLoadedImageSize(event.currentTarget);

          if (loadedImageSize) {
            setNaturalSize(loadedImageSize);
          }
        }}
        src={src}
        style={
          cropFrameStyle
            ? {
                ...cropFrameStyle,
              }
            : {
                height: "100%",
                left: "0",
                top: "0",
                width: "100%",
                objectFit: "cover",
              }
        }
      />
      {isCropPending ? <span aria-hidden className="absolute inset-0 bg-secondary" /> : null}
    </span>
  );
}
