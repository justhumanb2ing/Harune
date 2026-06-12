"use client";

import { useCallback, useState } from "react";
import { deleteProfileImage } from "@/lib/api/generated/http/profile-api/profile-api";
import { uploadProfileImageIfChanged } from "@/lib/profile/client-image-upload";
import { getProfileImageFileError, type ProfileImageKind } from "@/lib/profile/image-upload";
import type { ProfileImageCrop } from "@/lib/profile/types";

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
  await deleteProfileImage({
    imageUrl,
  });
}

const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result !== "string") {
        reject(new Error("Failed to read image preview."));
        return;
      }

      resolve(reader.result);
    };

    reader.onerror = () => {
      reject(reader.error ?? new Error("Failed to read image preview."));
    };

    reader.readAsDataURL(file);
  });

export function useProfileImageUpload() {
  const [state, setState] = useState<ProfileImageUploadState>(initialState);

  const clear = useCallback(() => {
    setState(initialState);
  }, []);

  const selectFile = useCallback(async (file: File) => {
    const validationError = getProfileImageFileError(file);

    if (validationError) {
      setState((prev) => ({
        ...prev,
        error: validationError,
        isUploading: false,
      }));
      throw new Error(validationError);
    }

    const previewUrl = await readFileAsDataUrl(file);

    setState({
      error: null,
      isUploading: false,
      previewUrl,
      selectedFile: file,
      selectedFileName: file.name,
    });
  }, []);

  const uploadSelectedFile = useCallback(
    async (
      kind: ProfileImageKind,
      currentUrl: string | null = null,
      options: { imageCrop?: ProfileImageCrop | null; persist?: boolean } = {}
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
          imageCrop: options.imageCrop ?? null,
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

  return {
    ...state,
    clear,
    selectFile,
    uploadSelectedFile,
  };
}
