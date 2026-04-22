"use client";

import {
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { type ChangeEvent, useEffect, useMemo, useRef } from "react";
import { toast } from "sonner";

import {
  useProfilePageEditorStore,
  useProfilePageEditorStoreApi,
} from "@/components/section/profile-page/profile-page-editor-provider";
import {
  type ProfilePageEditorState,
  buildSyncPayload,
} from "@/components/section/profile-page/profile-page-editor-store";
import { deleteUploadedProfileImage } from "@/hooks/use-profile-image-upload";
import { PROFILE_IMAGE_UPLOAD_ROUTE } from "@/lib/profile-page/image-upload";
import { profilePageQueryOptions } from "@/lib/profile-page/query-options";
import type {
  DraftLinkItem,
  DraftTextBoxItem,
  ProfilePageData,
  SocialPlatform,
} from "@/lib/profile-page/types";
import { apiFetch } from "@/lib/react-query/fetcher";
import { ClientS3Uploader } from "@/lib/s3/clientS3Uploader";
import useUser from "@/lib/users/useUser";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export const socialPlatforms: Array<{ key: SocialPlatform; label: string; placeholder: string }> = [
  { key: "x", label: "X", placeholder: "https://x.com/yourname" },
  { key: "instagram", label: "Instagram", placeholder: "https://instagram.com/yourname" },
  { key: "youtube", label: "YouTube", placeholder: "https://youtube.com/@yourname" },
  { key: "linkedin", label: "LinkedIn", placeholder: "https://linkedin.com/in/yourname" },
  { key: "github", label: "GitHub", placeholder: "https://github.com/yourname" },
];

const uploader = new ClientS3Uploader({ presignedRouteProvider: PROFILE_IMAGE_UPLOAD_ROUTE });

const selectSocialDrafts = (state: ProfilePageEditorState) =>
  socialPlatforms.reduce<Record<SocialPlatform, string>>(
    (accumulator, platform) => {
      accumulator[platform.key] =
        state.draftData?.socialLinks.find((item) => item.platform === platform.key)?.url ?? "";
      return accumulator;
    },
    {} as Record<SocialPlatform, string>
  );

export function useProfilePageEditor() {
  const { isLoading: isUserLoading, mutate, user } = useUser();
  const queryClient = useQueryClient();
  const store = useProfilePageEditorStoreApi();
  const profilePageQuery = useQuery(profilePageQueryOptions());
  const draftData = useProfilePageEditorStore((state) => state.draftData);
  const newLink = useProfilePageEditorStore((state) => state.newLink);
  const newTextBox = useProfilePageEditorStore((state) => state.newTextBox);
  const previewImageUrl = useProfilePageEditorStore((state) => state.previewImageUrl);
  const syncStatus = useProfilePageEditorStore((state) => state.syncStatus);
  const syncError = useProfilePageEditorStore((state) => state.syncError);
  const hasUnsyncedChanges = useProfilePageEditorStore((state) => state.hasUnsyncedChanges);
  const socialDrafts = useProfilePageEditorStore(selectSocialDrafts);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (profilePageQuery.error && !draftData) {
      toast.error(
        profilePageQuery.error instanceof Error
          ? profilePageQuery.error.message
          : "Failed to load profile page."
      );
    }
  }, [draftData, profilePageQuery.error]);

  const fallbackName = draftData?.page.name || user?.name || "Profile";
  const previewImageSrc = previewImageUrl ?? draftData?.page.image ?? undefined;
  const previewInitials =
    fallbackName
      .split(/\s+/)
      .map((value) => value[0] ?? "")
      .join("")
      .slice(0, 2)
      .toUpperCase() || "P";

  const profileForm = useMemo(
    () => ({
      handle: draftData?.page.handle ?? "",
      name: draftData?.page.name ?? "",
      bio: draftData?.page.bio ?? "",
      image: draftData?.page.image ?? null,
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
      toast.error(error instanceof Error ? error.message : "Failed to select image.");
    }
  };

  const setSocialUrl = (platform: SocialPlatform, value: string) => {
    store.actions.setSocialUrl(platform, value);
  };

  const handleSync = async () => {
    const currentState = store.getState();
    const profilePageQueryKey = profilePageQueryOptions().queryKey;

    if (!currentState.draftData || currentState.syncStatus === "syncing") {
      return;
    }

    let uploadedImageUrl: string | null = null;

    try {
      store.actions.setSyncStatus("syncing");
      await queryClient.cancelQueries({ queryKey: profilePageQueryKey });

      let nextDraftData = currentState.draftData;

      if (currentState.pendingImageFile) {
        uploadedImageUrl = await uploader.uploadFile(currentState.pendingImageFile);
        nextDraftData = {
          ...currentState.draftData,
          page: {
            ...currentState.draftData.page,
            image: uploadedImageUrl,
          },
        };
      }

      const response = await apiFetch<ProfilePageData>("/api/app/profile-page/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(buildSyncPayload(nextDraftData)),
      });

      queryClient.setQueryData(profilePageQueryKey, response);
      store.actions.rebaseFromServer(response);
      await mutate();
      toast("Synced");
    } catch (error) {
      if (uploadedImageUrl) {
        try {
          await deleteUploadedProfileImage(uploadedImageUrl);
        } catch (rollbackError) {
          console.error("Failed to rollback uploaded profile image:", rollbackError);
        }
      }

      const message = error instanceof Error ? error.message : "Failed to sync profile page.";
      store.actions.setSyncError(message);
    }
  };

  const setNewLink = (
    updater:
      | ProfilePageEditorState["newLink"]
      | ((current: ProfilePageEditorState["newLink"]) => ProfilePageEditorState["newLink"])
  ) => {
    store.actions.setNewLink(updater);
  };

  const setNewTextBox = (
    updater:
      | ProfilePageEditorState["newTextBox"]
      | ((current: ProfilePageEditorState["newTextBox"]) => ProfilePageEditorState["newTextBox"])
  ) => {
    store.actions.setNewTextBox(updater);
  };

  const handleLinkDragEnd = (event: DragEndEvent) => {
    if (!event.over || event.active.id === event.over.id) {
      return;
    }

    store.actions.reorderLinkItems(String(event.active.id), String(event.over.id));
  };

  const handleSocialLinkDragEnd = (event: DragEndEvent) => {
    if (!event.over || event.active.id === event.over.id) {
      return;
    }

    store.actions.reorderSocialLinks(
      String(event.active.id) as SocialPlatform,
      String(event.over.id) as SocialPlatform
    );
  };

  const handleTextBoxDragEnd = (event: DragEndEvent) => {
    if (!event.over || event.active.id === event.over.id) {
      return;
    }

    store.actions.reorderTextBoxItems(String(event.active.id), String(event.over.id));
  };

  return {
    data: draftData,
    fallbackName,
    handleCreateLink: () => store.actions.addNewLink(),
    handleCreateTextBox: () => store.actions.addNewTextBox(),
    handleDeleteLink: (id: string) => store.actions.removeLinkItem(id),
    handleDeleteSocialLink: (platform: SocialPlatform) => store.actions.removeSocialLink(platform),
    handleDeleteTextBox: (id: string) => store.actions.removeTextBoxItem(id),
    handleLinkDragEnd,
    handleLinkItemChange: (
      id: string,
      key: keyof Omit<DraftLinkItem, "id" | "position">,
      value: string
    ) => store.actions.updateLinkItem(id, key, value),
    handleNewTextBoxComposerBlur: () => store.actions.resetNewTextBoxComposer(),
    handleProfileImageChange,
    handleSocialLinkDragEnd,
    handleSync,
    handleTextBoxChange: (
      id: string,
      key: keyof Omit<DraftTextBoxItem, "id" | "position">,
      value: string
    ) => store.actions.updateTextBoxItem(id, key, value),
    handleTextBoxDragEnd,
    hasUnsyncedChanges,
    imageInputRef,
    isBooting: !draftData && profilePageQuery.isPending,
    isSyncing: syncStatus === "syncing",
    isUserLoading,
    newLink,
    newTextBox,
    previewImageSrc,
    previewInitials,
    profileForm,
    removeProfileImage: () => store.actions.removeImage(),
    setNewLink,
    setNewTextBox,
    setProfileField: (field: "bio" | "handle" | "name", value: string) =>
      store.actions.setProfileField(field, value),
    setSocialUrl,
    socialDrafts,
    syncError,
    syncStatus,
    sensors,
  };
}
