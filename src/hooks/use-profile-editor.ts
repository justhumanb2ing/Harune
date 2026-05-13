"use client";

import { useQueryClient } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import { type ChangeEvent, useMemo, useRef } from "react";
import { toast } from "sonner";
import {
  useProfilePageEditorStore,
  useProfilePageEditorStoreApi,
} from "@/components/profile/layout/profile-editor-provider";
import { normalizeProfileBentoItems } from "@/components/profile/v2/profile-bento-grid-model";
import { buildSyncPayload } from "@/hooks/profile-editor-store";
import type { getMeResponse } from "@/lib/api/generated/http/me-api/me-api";
import { getGetMeQueryKey } from "@/lib/api/generated/http/me-api/me-api";
import {
  useGetProfileByHandleSuspense,
  useUpdateProfilePage,
} from "@/lib/api/generated/http/profile-api/profile-api";
import type { GetMe200 } from "@/lib/api/generated/http/schemas/me-api";
import type {
  UpdateProfilePageBody,
  UpdateProfilePageBodyBentoItem,
} from "@/lib/api/generated/http/schemas/profile-api";
import { getProfileRouteHandle } from "@/lib/profile/app-paths";
import { uploadProfileImageIfChanged } from "@/lib/profile/client-image-upload";
import { toProfilePageEditorDataFromPublicPage } from "@/lib/profile/public-profile-page";
import { PROFILE_PAGE_STALE_TIME_MS } from "@/lib/profile/query-policy";
import type { ProfileBentoItem, ProfilePageData, ProfilePageDraftData } from "@/lib/profile/types";
import useUser from "@/lib/users/use-user";

export function useProfilePageEditor(initialUser?: GetMe200 | null) {
  const { isLoading: isUserLoading, mutate, user } = useUser(initialUser);
  const queryClient = useQueryClient();
  const store = useProfilePageEditorStoreApi();
  const pathname = usePathname();
  const currentHandle = getProfileRouteHandle(pathname);
  const profilePageQuery = useGetProfileByHandleSuspense(currentHandle, {
    query: {
      select: (response) => {
        if (response.status !== 200) {
          throw new Error("Failed to load profile page.");
        }

        return toProfilePageEditorDataFromPublicPage(response.data.page);
      },
      staleTime: PROFILE_PAGE_STALE_TIME_MS,
    },
  });
  const { mutateAsync: updateProfilePageMutation } = useUpdateProfilePage({
    request: {
      cache: "no-store",
      headers: {
        "Cache-Control": "no-store",
      },
    },
  });
  const draftData = useProfilePageEditorStore((state) => state.draftData);
  const previewImageUrl = useProfilePageEditorStore((state) => state.previewImageUrl);
  const previewBackgroundImageUrl = useProfilePageEditorStore(
    (state) => state.previewBackgroundImageUrl
  );
  const syncStatus = useProfilePageEditorStore((state) => state.syncStatus);
  const syncError = useProfilePageEditorStore((state) => state.syncError);
  const hasUnsyncedChanges = useProfilePageEditorStore((state) => state.hasUnsyncedChanges);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const backgroundImageInputRef = useRef<HTMLInputElement | null>(null);

  const fallbackName = draftData?.page.name || user?.name || "Profile";
  const previewImageSrc = previewImageUrl ?? draftData?.page.image ?? undefined;
  const previewBackgroundImageSrc =
    previewBackgroundImageUrl ?? draftData?.page.backgroundImage ?? undefined;

  const profileForm = useMemo(
    () => ({
      handle: draftData?.page.handle ?? "",
      location: draftData?.page.location ?? "",
      name: draftData?.page.name ?? "",
      role: draftData?.page.role ?? "",
      bio: draftData?.page.bio ?? "",
      image: draftData?.page.image ?? null,
      backgroundImage: draftData?.page.backgroundImage ?? null,
    }),
    [draftData]
  );

  const handleProfileImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    try {
      store.actions.selectImage(file);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to select image");
    }
  };

  const handleBackgroundImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    try {
      store.actions.selectBackgroundImage(file);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to select image");
    }
  };

  const handleSync = async ({
    draftDataOverride,
    bento,
  }: {
    draftDataOverride?: ProfilePageDraftData;
    bento?: UpdateProfilePageBodyBentoItem[];
  } = {}) => {
    const currentState = store.getState();
    const profilePageQueryKey = profilePageQuery.queryKey;
    const syncDraftData = draftDataOverride ?? currentState.draftData;

    if (!syncDraftData || currentState.syncStatus === "syncing") {
      return null;
    }

    try {
      store.actions.setSyncStatus("syncing");
      await queryClient.cancelQueries({ queryKey: profilePageQueryKey });

      const requestDraftData = syncDraftData;
      const { handle: _handle, ...updateProfilePageBody } = buildSyncPayload(requestDraftData).page;
      const requestBody = bento
        ? {
            ...updateProfilePageBody,
            bento: bento as UpdateProfilePageBody["bento"],
          }
        : updateProfilePageBody;

      const response = await updateProfilePageMutation({ data: requestBody });

      if (response.status !== 200) {
        throw new Error("Failed to sync");
      }

      const profilePageData: ProfilePageData = toProfilePageEditorDataFromPublicPage(
        response.data.page
      );
      const normalizedBento = normalizeProfileBentoItems(response.data.bento as ProfileBentoItem[]);

      queryClient.setQueryData(profilePageQueryKey, profilePageData);
      queryClient.setQueryData<getMeResponse>(getGetMeQueryKey(), (current) => {
        if (!current || current.status !== 200 || !current.data.profilePage) {
          return current;
        }

        return {
          ...current,
          data: {
            ...current.data,
            profilePage: {
              ...current.data.profilePage,
              handle: profilePageData.page.handle,
              image: profilePageData.page.image,
              name: profilePageData.page.name,
            },
          },
        };
      });
      store.actions.rebaseFromServer(profilePageData);
      await mutate();
      await queryClient.invalidateQueries({
        queryKey: profilePageQueryKey,
        refetchType: "active",
      });
      return {
        ...response,
        data: {
          ...response.data,
          bento: normalizedBento,
        },
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to sync";
      store.actions.setSyncError(message);
      return null;
    }
  };

  const uploadPendingImages = async (syncDraftData: ProfilePageDraftData) => {
    const currentState = store.getState();

    const pendingImageUpload = currentState.pendingImageFile
      ? uploadProfileImageIfChanged({
          currentUrl: syncDraftData.page.image,
          file: currentState.pendingImageFile,
          kind: "profile",
          persist: false,
        })
      : Promise.resolve(syncDraftData.page.image);
    const pendingBackgroundImageUpload = currentState.pendingBackgroundImageFile
      ? uploadProfileImageIfChanged({
          currentUrl: syncDraftData.page.backgroundImage,
          file: currentState.pendingBackgroundImageFile,
          kind: "background",
          persist: false,
        })
      : Promise.resolve(syncDraftData.page.backgroundImage);

    const [uploadedImageUrl, uploadedBackgroundImageUrl] = await Promise.all([
      pendingImageUpload,
      pendingBackgroundImageUpload,
    ]);

    let nextDraftData = syncDraftData;

    if (uploadedImageUrl !== syncDraftData.page.image) {
      nextDraftData = {
        ...nextDraftData,
        page: {
          ...nextDraftData.page,
          image: uploadedImageUrl,
        },
      };
    }

    if (uploadedBackgroundImageUrl !== syncDraftData.page.backgroundImage) {
      nextDraftData = {
        ...nextDraftData,
        page: {
          ...nextDraftData.page,
          backgroundImage: uploadedBackgroundImageUrl,
        },
      };
    }

    return nextDraftData;
  };

  return {
    data: draftData,
    fallbackName,
    handleBackgroundImageChange,
    handleProfileImageChange,
    handleSync,
    hasUnsyncedChanges,
    backgroundImageInputRef,
    imageInputRef,
    isBooting: false,
    isSyncing: syncStatus === "syncing",
    isUserLoading,
    previewBackgroundImageSrc,
    previewImageSrc,
    profileForm,
    uploadPendingImages,
    removeBackgroundImage: () => store.actions.removeBackgroundImage(),
    removeProfileImage: () => store.actions.removeImage(),
    setProfileField: (field: "bio" | "handle" | "location" | "name" | "role", value: string) =>
      store.actions.setProfileField(field, value),
    syncError,
    syncStatus,
  };
}
