"use client";

export function getProfileImageProxyUrl(imageSrc: string | null | undefined) {
  if (!imageSrc) {
    return null;
  }

  if (imageSrc.startsWith("blob:") || imageSrc.startsWith("data:")) {
    return imageSrc;
  }

  try {
    const url = new URL(imageSrc);

    if (url.origin === window.location.origin) {
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
