"use client";

import { uploadProfileImageIfChanged } from "@/lib/profile-page/client-image-upload";
import {
  PROFILE_IMAGE_UPLOAD_ROUTE,
  type ProfileImageKind,
  getProfileImageFileError,
} from "@/lib/profile-page/image-upload";
import { apiFetch } from "@/lib/react-query/fetcher";
import { useCallback, useEffect, useRef, useState } from "react";

type ProfileImageUploadState = {
  error: string | null;
  isUploading: boolean;
  previewUrl: string | null;
  selectedFile: File | null;
  selectedFileName: string | null;
};

const initialState: ProfileImageUploadState = {
  error: null,
  isUploading: false,
  previewUrl: null,
  selectedFile: null,
  selectedFileName: null,
};

export async function deleteUploadedProfileImage(imageUrl: string) {
  await apiFetch<{ success: true }>(PROFILE_IMAGE_UPLOAD_ROUTE, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      imageUrl,
    }),
  });
}

export function useProfileImageUpload() {
  const previewUrlRef = useRef<string | null>(null);
  const [state, setState] = useState<ProfileImageUploadState>(initialState);

  const revokePreviewUrl = useCallback(() => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
  }, []);

  const clear = useCallback(() => {
    revokePreviewUrl();
    setState(initialState);
  }, [revokePreviewUrl]);

  const selectFile = useCallback(
    (file: File) => {
      const validationError = getProfileImageFileError(file);

      if (validationError) {
        setState((prev) => ({
          ...prev,
          error: validationError,
          isUploading: false,
        }));
        throw new Error(validationError);
      }

      const previewUrl = URL.createObjectURL(file);
      revokePreviewUrl();
      previewUrlRef.current = previewUrl;

      setState({
        error: null,
        isUploading: false,
        previewUrl,
        selectedFile: file,
        selectedFileName: file.name,
      });
    },
    [revokePreviewUrl]
  );

  const uploadSelectedFile = useCallback(
    async (
      kind: ProfileImageKind,
      currentUrl: string | null = null,
      options: { persist?: boolean } = {}
    ) => {
      if (!state.selectedFile) {
        return null;
      }

      setState((prev) => ({
        ...prev,
        error: null,
        isUploading: true,
      }));

      try {
        const uploadedUrl = await uploadProfileImageIfChanged({
          currentUrl,
          file: state.selectedFile,
          kind,
          persist: options.persist ?? false,
        });

        setState((prev) => ({
          ...prev,
          error: null,
          isUploading: false,
        }));

        return uploadedUrl;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to upload image.";

        setState((prev) => ({
          ...prev,
          error: errorMessage,
          isUploading: false,
        }));

        throw error;
      }
    },
    [state.selectedFile]
  );

  useEffect(() => revokePreviewUrl, [revokePreviewUrl]);

  return {
    ...state,
    clear,
    selectFile,
    uploadSelectedFile,
  };
}
