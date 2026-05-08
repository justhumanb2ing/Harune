"use client";

import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import { type ChangeEvent, useMemo, useRef } from "react";
import { toast } from "sonner";
import {
  useProfilePageEditorStore,
  useProfilePageEditorStoreApi,
} from "@/components/profile/layout/profile-editor-provider";
import { buildSyncPayload } from "@/hooks/profile-editor-store";
import { getGetMeQueryKey } from "@/lib/api/generated/http/me-api/me-api";
import { updateProfilePage } from "@/lib/api/generated/http/profile-api/profile-api";
import type { GetMe200 } from "@/lib/api/generated/http/schemas/me-api";
import { getProfileRouteHandle } from "@/lib/profile/app-paths";
import { uploadProfileImageIfChanged } from "@/lib/profile/client-image-upload";
import { toProfilePageEditorDataFromPublicPage } from "@/lib/profile/public-profile-page";
import { profilePageQueryOptions } from "@/lib/profile/query-options";
import type { ProfilePageData, ProfilePageDraftData } from "@/lib/profile/types";
import useUser from "@/lib/users/use-user";

export function useProfilePageEditor() {
  const { isLoading: isUserLoading, mutate, user } = useUser();
  const queryClient = useQueryClient();
  const store = useProfilePageEditorStoreApi();
  const pathname = usePathname();
  const currentHandle = getProfileRouteHandle(pathname);
  useSuspenseQuery(profilePageQueryOptions(currentHandle));
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
      toast.error(
        (error instanceof Error ? error.message : "Failed to select image").replace(/\./g, "")
      );
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
      toast.error(
        (error instanceof Error ? error.message : "Failed to select image").replace(/\./g, "")
      );
    }
  };

  const handleSync = async (draftDataOverride?: ProfilePageDraftData) => {
    const currentState = store.getState();
    const profilePageQueryKey = profilePageQueryOptions(currentHandle).queryKey;
    const syncDraftData = draftDataOverride ?? currentState.draftData;

    if (!syncDraftData || currentState.syncStatus === "syncing") {
      return null;
    }

    try {
      store.actions.setSyncStatus("syncing");
      await queryClient.cancelQueries({ queryKey: profilePageQueryKey });

      let nextDraftData = syncDraftData;

      if (currentState.pendingImageFile) {
        const uploadedImageUrl = await uploadProfileImageIfChanged({
          currentUrl: syncDraftData.page.image,
          file: currentState.pendingImageFile,
          kind: "profile",
        });
        nextDraftData = {
          ...nextDraftData,
          page: {
            ...nextDraftData.page,
            image: uploadedImageUrl,
          },
        };
      }

      if (currentState.pendingBackgroundImageFile) {
        const uploadedBackgroundImageUrl = await uploadProfileImageIfChanged({
          currentUrl: syncDraftData.page.backgroundImage,
          file: currentState.pendingBackgroundImageFile,
          kind: "background",
        });
        nextDraftData = {
          ...nextDraftData,
          page: {
            ...nextDraftData.page,
            backgroundImage: uploadedBackgroundImageUrl,
          },
        };
      }

      const latestDraftData = draftDataOverride ?? store.getState().draftData ?? nextDraftData;
      const requestDraftData: ProfilePageDraftData = {
        ...latestDraftData,
        page: {
          ...latestDraftData.page,
          image: nextDraftData.page.image,
          backgroundImage: nextDraftData.page.backgroundImage,
        },
      };
      const { handle: _handle, ...updateProfilePageBody } = buildSyncPayload(requestDraftData).page;

      const response = await updateProfilePage(updateProfilePageBody, {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-store",
        },
      });

      if (response.status !== 200) {
        throw new Error("Failed to sync");
      }

      const profilePageData: ProfilePageData = toProfilePageEditorDataFromPublicPage(
        response.data.page
      );

      queryClient.setQueryData(profilePageQueryKey, profilePageData);
      queryClient.setQueryData<GetMe200>(getGetMeQueryKey(), (current) => {
        if (!current?.profilePage) {
          return current;
        }

        return {
          ...current,
          profilePage: {
            ...current.profilePage,
            handle: profilePageData.page.handle,
            image: profilePageData.page.image,
            name: profilePageData.page.name,
          },
        };
      });
      store.actions.rebaseFromServer(profilePageData);
      await mutate();
      return profilePageData;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to sync";
      store.actions.setSyncError(message);
      return null;
    }
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
    removeBackgroundImage: () => store.actions.removeBackgroundImage(),
    removeProfileImage: () => store.actions.removeImage(),
    setProfileField: (field: "bio" | "handle" | "location" | "name" | "role", value: string) =>
      store.actions.setProfileField(field, value),
    syncError,
    syncStatus,
  };
}
