"use client";

import { useEffect, useState } from "react";
import { getProfileImageObjectPosition, type ImageSize } from "@/lib/profile/avatar-image";
import type { ProfileImageCrop } from "@/lib/profile/types";
import { cn } from "@/lib/utils";

type ProfileAvatarImageProps = {
  alt: string;
  className?: string;
  imageCrop?: ProfileImageCrop | null;
  src: string;
};

export function ProfileAvatarImage({ alt, className, imageCrop, src }: ProfileAvatarImageProps) {
  const [displaySrc, setDisplaySrc] = useState(src);
  const [naturalSize, setNaturalSize] = useState<ImageSize | null>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: reset cached dimensions when src changes.
  useEffect(() => {
    setNaturalSize(null);
  }, [src]);

  useEffect(() => {
    let active = true;

    if (src === displaySrc) {
      return () => {
        active = false;
      };
    }

    const image = new Image();
    image.crossOrigin = "anonymous";
    image.decoding = "async";
    image.src = src;

    const applyNextSrc = () => {
      if (active) {
        setDisplaySrc(src);
      }
    };

    image.onload = applyNextSrc;
    image.onerror = applyNextSrc;

    if (typeof image.decode === "function") {
      void image.decode().then(applyNextSrc).catch(applyNextSrc);
    }

    return () => {
      active = false;
    };
  }, [displaySrc, src]);

  return (
    // biome-ignore lint/performance/noImgElement: user-generated remote/blob avatar image.
    <img
      alt={alt}
      className={cn("object-cover", className)}
      onLoad={(event) => {
        setNaturalSize({
          height: event.currentTarget.naturalHeight,
          width: event.currentTarget.naturalWidth,
        });
      }}
      decoding="async"
      fetchPriority="high"
      loading="eager"
      src={displaySrc}
      style={{
        objectPosition: getProfileImageObjectPosition(imageCrop, naturalSize),
      }}
    />
  );
}
