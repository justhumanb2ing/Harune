"use client";

import type { Area } from "react-easy-crop";

const imageLoadCache = new Map<string, Promise<HTMLImageElement>>();
const MAX_IMAGE_LOAD_CACHE_ENTRIES = 6;

export function resolveCropImageSource(imageSrc: string, appOrigin = globalThis.location?.origin) {
  if (imageSrc.startsWith("blob:") || imageSrc.startsWith("data:")) {
    return imageSrc;
  }

  try {
    const url = new URL(imageSrc, appOrigin);

    if (appOrigin && url.origin === appOrigin) {
      return imageSrc;
    }

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return imageSrc;
    }

    return `/api/profile/image-proxy?url=${encodeURIComponent(imageSrc)}`;
  } catch {
    return imageSrc;
  }
}

function loadImage(imageSrc: string) {
  const cachedImage = imageLoadCache.get(imageSrc);

  if (cachedImage) {
    return cachedImage;
  }

  const imagePromise = new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => {
      imageLoadCache.delete(imageSrc);
      reject(new Error("Failed to load crop image."));
    };
    image.src = imageSrc;
  });

  imageLoadCache.set(imageSrc, imagePromise);

  if (imageLoadCache.size > MAX_IMAGE_LOAD_CACHE_ENTRIES) {
    const oldestKey = imageLoadCache.keys().next().value as string | undefined;

    if (oldestKey) {
      imageLoadCache.delete(oldestKey);
    }
  }

  return imagePromise;
}

export function preloadCropImageSource(imageSrc: string) {
  const resolvedImageSrc = resolveCropImageSource(imageSrc);

  void loadImage(resolvedImageSrc).catch(() => {
    imageLoadCache.delete(resolvedImageSrc);
  });
}

export async function createCroppedImagePreviewUrl(imageSrc: string, croppedAreaPixels: Area) {
  const resolvedImageSrc = resolveCropImageSource(imageSrc);
  const image = await loadImage(resolvedImageSrc);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(croppedAreaPixels.width));
  canvas.height = Math.max(1, Math.round(croppedAreaPixels.height));

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Failed to create crop preview.");
  }

  context.drawImage(
    image,
    croppedAreaPixels.x,
    croppedAreaPixels.y,
    croppedAreaPixels.width,
    croppedAreaPixels.height,
    0,
    0,
    canvas.width,
    canvas.height
  );

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((result) => {
      if (result) {
        resolve(result);
        return;
      }

      reject(new Error("Failed to create crop preview."));
    }, "image/png");
  });

  return URL.createObjectURL(blob);
}
