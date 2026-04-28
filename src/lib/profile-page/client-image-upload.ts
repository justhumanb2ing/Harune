"use client";

import {
  getProfileImageCacheVersion,
  PROFILE_IMAGE_UPLOAD_ROUTE,
  type ProfileImageKind,
} from "@/lib/profile-page/image-upload";
import { apiFetch } from "@/lib/react-query/fetcher";
import { ClientS3Uploader } from "@/lib/s3/client-s3-uploader";

const uploader = new ClientS3Uploader({ presignedRouteProvider: PROFILE_IMAGE_UPLOAD_ROUTE });

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

  const uploadedUrl = await uploader.uploadFile(file, {
    meta: {
      imageHash,
      imageKind: kind,
    },
  });

  if (!persist) {
    return uploadedUrl;
  }

  const finalized = await apiFetch<{ imageUrl: string | null }>(PROFILE_IMAGE_UPLOAD_ROUTE, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      imageKind: kind,
      imageUrl: uploadedUrl,
    }),
  });

  return finalized.imageUrl ?? uploadedUrl;
}
