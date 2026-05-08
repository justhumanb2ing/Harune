"use client";

import {
  finalizeProfileImage,
  uploadProfileImage,
} from "@/lib/api/generated/http/profile-api/profile-api";
import { getProfileImageCacheVersion, type ProfileImageKind } from "@/lib/profile/image-upload";

export async function getFileSha256Hex(file: File) {
  const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function uploadProfileImageIfChanged({
  currentUrl,
  file,
  kind,
  persist = true,
}: {
  currentUrl: string | null;
  file: File;
  kind: ProfileImageKind;
  persist?: boolean;
}) {
  const imageHash = await getFileSha256Hex(file);

  if (getProfileImageCacheVersion(currentUrl) === imageHash) {
    return currentUrl;
  }

  const uploaded = await uploadProfileImage({
    file,
    imageHash,
    imageKind: kind,
  });

  if (uploaded.status !== 200) {
    throw new Error("Failed to upload profile image.");
  }

  if (!persist) {
    return uploaded.data.imageUrl;
  }

  const finalized = await finalizeProfileImage({
    imageKind: kind,
    imageUrl: uploaded.data.imageUrl,
  });

  if (finalized.status !== 200) {
    return uploaded.data.imageUrl;
  }

  return finalized.data.imageUrl ?? uploaded.data.imageUrl;
}
