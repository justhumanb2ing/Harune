"use client";

import {
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import { type ChangeEvent, useMemo, useRef } from "react";
import { toast } from "sonner";
import {
  useProfilePageEditorStore,
  useProfilePageEditorStoreApi,
} from "@/components/profile/layout/profile-editor-provider";
import {
  buildSyncPayload,
  getPageEditorBlocks,
  type ProfilePageEditorState,
} from "@/hooks/profile-editor-store";
import type { MeResponse } from "@/lib/api/app/types";
import { getProfileRouteHandle } from "@/lib/profile/app-paths";
import { uploadProfileImageIfChanged } from "@/lib/profile/client-image-upload";
import { profilePageQueryOptions } from "@/lib/profile/query-options";
import {
  type DraftLinkItem,
  type DraftPlaylistItem,
  type DraftTextBoxItem,
  MAX_SOCIAL_LINKS,
  type ProfilePageData,
  type ProfilePageDraftData,
  type SocialPlatform,
} from "@/lib/profile/types";
import { apiFetch } from "@/lib/react-query/fetcher";
import { queryKeys } from "@/lib/react-query/query-keys";
import useUser from "@/lib/users/use-user";

export const socialPlatforms: Array<{ key: SocialPlatform; label: string; placeholder: string }> = [
  { key: "x", label: "X", placeholder: "https://x.com/yourname" },
  { key: "instagram", label: "Instagram", placeholder: "https://instagram.com/yourname" },
  { key: "youtube", label: "YouTube", placeholder: "https://youtube.com/@yourname" },
  { key: "linkedin", label: "LinkedIn", placeholder: "https://linkedin.com/in/yourname" },
  { key: "github", label: "GitHub", placeholder: "https://github.com/yourname" },
  { key: "threads", label: "Threads", placeholder: "https://www.threads.net/@yourname" },
  { key: "soundcloud", label: "SoundCloud", placeholder: "https://soundcloud.com/yourname" },
  { key: "spotify", label: "Spotify", placeholder: "https://open.spotify.com/artist/yourid" },
  { key: "behance", label: "Behance", placeholder: "https://www.behance.net/yourname" },
  { key: "tiktok", label: "TikTok", placeholder: "https://www.tiktok.com/@yourname" },
  { key: "mail", label: "Email", placeholder: "example@domain.com" },
  {
    key: "apple_music",
    label: "Apple Music",
    placeholder: "https://music.apple.com/profile/yourname",
  },
];

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
  const pathname = usePathname();
  const currentHandle = getProfileRouteHandle(pathname);
  useSuspenseQuery(profilePageQueryOptions(currentHandle));
  const draftData = useProfilePageEditorStore((state) => state.draftData);
  const newLink = useProfilePageEditorStore((state) => state.newLink);
  const newTextBox = useProfilePageEditorStore((state) => state.newTextBox);
  const previewImageUrl = useProfilePageEditorStore((state) => state.previewImageUrl);
  const previewBackgroundImageUrl = useProfilePageEditorStore(
    (state) => state.previewBackgroundImageUrl
  );
  const syncStatus = useProfilePageEditorStore((state) => state.syncStatus);
  const syncError = useProfilePageEditorStore((state) => state.syncError);
  const hasUnsyncedChanges = useProfilePageEditorStore((state) => state.hasUnsyncedChanges);
  const socialDrafts = useProfilePageEditorStore(selectSocialDrafts);
  const pageEditorBlocks = useProfilePageEditorStore((state) =>
    state.draftData ? getPageEditorBlocks(state.draftData) : []
  );
  const selectedSocialLinkCount = useProfilePageEditorStore(
    (state) => state.draftData?.socialLinks.length ?? 0
  );
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const backgroundImageInputRef = useRef<HTMLInputElement | null>(null);
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

  const fallbackName = draftData?.page.name || user?.name || "Profile";
  const previewImageSrc = previewImageUrl ?? draftData?.page.image ?? undefined;
  const previewBackgroundImageSrc =
    previewBackgroundImageUrl ?? draftData?.page.backgroundImage ?? undefined;
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

  const setSocialUrl = (platform: SocialPlatform, value: string) => {
    store.actions.setSocialUrl(platform, value);
  };

  const toggleSocialLink = (platform: SocialPlatform) => {
    const currentState = store.getState();
    const isSelected = currentState.draftData?.socialLinks.some(
      (item) => item.platform === platform
    );

    if (isSelected) {
      store.actions.removeSocialLink(platform);
      return;
    }

    if ((currentState.draftData?.socialLinks.length ?? 0) >= MAX_SOCIAL_LINKS) {
      return;
    }

    store.actions.addSocialLink(platform);
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

      const response = await apiFetch<ProfilePageData>("/api/profile/sync", {
        method: "POST",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
        body: JSON.stringify(buildSyncPayload(requestDraftData)),
      });

      queryClient.setQueryData(profilePageQueryKey, response);
      queryClient.setQueryData<MeResponse>(queryKeys.app.me(), (current) => {
        if (!current?.profilePage) {
          return current;
        }

        return {
          ...current,
          profilePage: {
            ...current.profilePage,
            handle: response.page.handle,
            image: response.page.image,
            name: response.page.name,
          },
        };
      });
      store.actions.rebaseFromServer(response);
      await mutate();
      toast("Synced");
      return response;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to sync";
      store.actions.setSyncError(message);
      return null;
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

  const handlePlaylistDragEnd = (event: DragEndEvent) => {
    if (!event.over || event.active.id === event.over.id) {
      return;
    }

    store.actions.reorderPlaylistItems(String(event.active.id), String(event.over.id));
  };

  const handlePageBlockDragEnd = (event: DragEndEvent) => {
    if (!event.over || event.active.id === event.over.id) {
      return;
    }

    store.actions.reorderPageBlocks(String(event.active.id), String(event.over.id));
  };

  return {
    data: draftData,
    fallbackName,
    handleCreateLink: () => store.actions.addNewLink(),
    handleCreatePlaylist: (draft: {
      content: string;
      provider: DraftPlaylistItem["provider"];
      title: string;
    }) => {
      store.actions.addPlaylistItemFromDraft(draft);
    },
    handleCreateTextBox: (draft?: { description: string; title: string }) => {
      if (draft) {
        store.actions.addNewTextBoxFromDraft(draft);
        return;
      }

      store.actions.addNewTextBox();
    },
    handleDeleteLink: (id: string) => store.actions.removeLinkItem(id),
    handleDeletePlaylist: (id: string) => store.actions.removePlaylistItem(id),
    handleDeleteSocialLink: (platform: SocialPlatform) => store.actions.removeSocialLink(platform),
    handleDeleteTextBox: (id: string) => store.actions.removeTextBoxItem(id),
    handleLinkDragEnd,
    handleLinkItemChange: (
      id: string,
      key: keyof Omit<DraftLinkItem, "id" | "position">,
      value: string
    ) => store.actions.updateLinkItem(id, key, value),
    handleNewTextBoxComposerBlur: () => store.actions.resetNewTextBoxComposer(),
    handlePageBlockDragEnd,
    handleBackgroundImageChange,
    handleProfileImageChange,
    handleSocialLinkDragEnd,
    handleSync,
    handleTextBoxChange: (
      id: string,
      key: keyof Omit<DraftTextBoxItem, "blockPosition" | "id" | "position">,
      value: string
    ) => store.actions.updateTextBoxItem(id, key, value),
    handleTextBoxDragEnd,
    handlePlaylistDragEnd,
    hasUnsyncedChanges,
    backgroundImageInputRef,
    imageInputRef,
    isBooting: false,
    isSyncing: syncStatus === "syncing",
    isUserLoading,
    newLink,
    newTextBox,
    pageEditorBlocks,
    previewBackgroundImageSrc,
    previewImageSrc,
    previewInitials,
    profileForm,
    removeBackgroundImage: () => store.actions.removeBackgroundImage(),
    removeProfileImage: () => store.actions.removeImage(),
    selectedSocialLinkCount,
    setNewLink,
    setNewTextBox,
    setProfileField: (field: "bio" | "handle" | "location" | "name" | "role", value: string) =>
      store.actions.setProfileField(field, value),
    setSocialUrl,
    toggleSocialLink,
    socialDrafts,
    syncError,
    syncStatus,
    sensors,
  };
}
