"use client";

import {
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { type ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import {
  deleteUploadedProfileImage,
  useProfileImageUpload,
} from "@/hooks/use-profile-image-upload";
import { profilePageQueryOptions } from "@/lib/profile-page/query-options";
import type {
  LinkItem,
  ProfilePageData,
  SocialLink,
  SocialPlatform,
  TextBoxItem,
} from "@/lib/profile-page/types";
import { apiFetch } from "@/lib/react-query/fetcher";
import useUser from "@/lib/users/useUser";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export const socialPlatforms: Array<{ key: SocialPlatform; label: string; placeholder: string }> = [
  { key: "x", label: "X", placeholder: "https://x.com/yourname" },
  { key: "instagram", label: "Instagram", placeholder: "https://instagram.com/yourname" },
  { key: "youtube", label: "YouTube", placeholder: "https://youtube.com/@yourname" },
  { key: "linkedin", label: "LinkedIn", placeholder: "https://linkedin.com/in/yourname" },
  { key: "github", label: "GitHub", placeholder: "https://github.com/yourname" },
];

const createEmptyLinkItem = () => ({
  title: "",
  description: "",
  favicon: "",
  url: "",
});

const createEmptyTextBoxItem = () => ({
  title: "",
  description: "",
});

const createProfileForm = (data: ProfilePageData | null) => ({
  handle: data?.page.handle ?? "",
  name: data?.page.name ?? "",
  bio: data?.page.bio ?? "",
  image: data?.page.image ?? null,
});

const createSocialDrafts = (data: ProfilePageData | null): Record<SocialPlatform, string> => ({
  x: data?.socialLinks.find((item) => item.platform === "x")?.url ?? "",
  instagram: data?.socialLinks.find((item) => item.platform === "instagram")?.url ?? "",
  youtube: data?.socialLinks.find((item) => item.platform === "youtube")?.url ?? "",
  linkedin: data?.socialLinks.find((item) => item.platform === "linkedin")?.url ?? "",
  github: data?.socialLinks.find((item) => item.platform === "github")?.url ?? "",
});

export function useProfilePageEditor() {
  const { user, isLoading: isUserLoading, mutate } = useUser();
  const queryClient = useQueryClient();
  const cachedData =
    queryClient.getQueryData<ProfilePageData | null>(profilePageQueryOptions().queryKey) ?? null;
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
  const profilePageQuery = useQuery(profilePageQueryOptions());

  const [data, setData] = useState<ProfilePageData | null>(cachedData);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingSocial, setIsSavingSocial] = useState<SocialPlatform | null>(null);
  const [isCreatingLink, setIsCreatingLink] = useState(false);
  const [isCreatingTextBox, setIsCreatingTextBox] = useState(false);
  const [profileForm, setProfileForm] = useState(createProfileForm(cachedData));
  const [socialDrafts, setSocialDrafts] = useState(createSocialDrafts(cachedData));
  const [newLink, setNewLink] = useState(createEmptyLinkItem());
  const [newTextBox, setNewTextBox] = useState(createEmptyTextBoxItem());
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const profileImageUpload = useProfileImageUpload();

  const updateCachedData = (
    updater: (current: ProfilePageData | null) => ProfilePageData | null
  ) => {
    setData((current) => {
      const nextData = updater(current);
      queryClient.setQueryData(profilePageQueryOptions().queryKey, nextData);
      return nextData;
    });
  };

  useEffect(() => {
    if (profilePageQuery.data !== undefined && data === null) {
      setData(profilePageQuery.data);
      setProfileForm(createProfileForm(profilePageQuery.data));
      setSocialDrafts(createSocialDrafts(profilePageQuery.data));
      profileImageUpload.clear();
    }
  }, [data, profileImageUpload, profilePageQuery.data]);

  useEffect(() => {
    if (profilePageQuery.error && !data) {
      toast.error(
        profilePageQuery.error instanceof Error
          ? profilePageQuery.error.message
          : "Failed to load profile page."
      );
    }
  }, [data, profilePageQuery.error]);

  useEffect(() => {
    if (!user?.name || profileForm.name || data?.page.name) {
      return;
    }

    setProfileForm((prev) => ({
      ...prev,
      name: user.name ?? "",
    }));
  }, [data?.page.name, profileForm.name, user?.name]);

  const fallbackName = profileForm.name || user?.name || "Profile";
  const previewImage = profileImageUpload.previewUrl ?? profileForm.image;
  const previewImageSrc = previewImage || undefined;
  const previewInitials =
    fallbackName
      .split(/\s+/)
      .map((value) => value[0] ?? "")
      .join("")
      .slice(0, 2)
      .toUpperCase() || "P";

  const socialLinkIdByPlatform = useMemo(() => {
    return new Map(data?.socialLinks.map((item) => [item.platform, item.id]) ?? []);
  }, [data?.socialLinks]);

  const handleProfileSave = async () => {
    if (profileImageUpload.isUploading) {
      toast.error("Image is still uploading.");
      return;
    }

    let uploadedImageUrl: string | null = null;

    try {
      setIsSavingProfile(true);
      uploadedImageUrl = await profileImageUpload.uploadSelectedFile();

      const response = await apiFetch<{ page: ProfilePageData["page"] }>("/api/app/profile-page", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          handle: profileForm.handle,
          name: profileForm.name,
          bio: profileForm.bio,
          image: uploadedImageUrl ?? profileForm.image,
        }),
      });

      setProfileForm((prev) => ({
        ...prev,
        image: response.page.image,
      }));
      updateCachedData((current) =>
        current
          ? {
              ...current,
              page: response.page,
            }
          : current
      );
      if (uploadedImageUrl) {
        profileImageUpload.clear();
      }
      await mutate();
      toast.success("Profile updated.");
    } catch (error) {
      if (uploadedImageUrl) {
        try {
          await deleteUploadedProfileImage(uploadedImageUrl);
        } catch (rollbackError) {
          console.error("Failed to rollback uploaded profile image:", rollbackError);
        }
      }

      toast.error(error instanceof Error ? error.message : "Failed to update profile.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleProfileImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    try {
      profileImageUpload.selectFile(file);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to select image.");
    }
  };

  const handleSocialSave = async (platform: SocialPlatform, nextValue?: string) => {
    const value = (nextValue ?? socialDrafts[platform]).trim();

    try {
      setIsSavingSocial(platform);

      if (!value) {
        const existingId = socialLinkIdByPlatform.get(platform);

        if (existingId) {
          await apiFetch(`/api/app/profile-page/social-links/${existingId}`, {
            method: "DELETE",
          });
          updateCachedData((current) =>
            current
              ? {
                  ...current,
                  socialLinks: current.socialLinks
                    .filter((item) => item.id !== existingId)
                    .map((item, index) => ({ ...item, position: index })),
                }
              : current
          );
        }

        toast.success("Social link removed.");
        return;
      }

      const response = await apiFetch<{ socialLink: SocialLink }>(
        "/api/app/profile-page/social-links",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            platform,
            url: value,
          }),
        }
      );

      updateCachedData((current) => {
        if (!current) {
          return current;
        }

        const withoutPlatform = current.socialLinks.filter((item) => item.platform !== platform);
        return {
          ...current,
          socialLinks: [...withoutPlatform, response.socialLink].sort(
            (a, b) => a.position - b.position
          ),
        };
      });
      toast.success("Social link saved.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save social link.");
    } finally {
      setIsSavingSocial(null);
    }
  };

  const handleDeleteSocialLink = async (platform: SocialPlatform) => {
    setSocialDrafts((prev) => ({
      ...prev,
      [platform]: "",
    }));
    await handleSocialSave(platform, "");
  };

  const handleCreateLink = async (link = newLink) => {
    try {
      setIsCreatingLink(true);
      const response = await apiFetch<{ linkItem: LinkItem }>("/api/app/profile-page/links", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(link),
      });

      updateCachedData((current) =>
        current
          ? {
              ...current,
              linkItems: [...current.linkItems, response.linkItem].sort(
                (a, b) => a.position - b.position
              ),
            }
          : current
      );
      setNewLink(createEmptyLinkItem());
      toast.success("Link added.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add link.");
    } finally {
      setIsCreatingLink(false);
    }
  };

  const handleLinkItemChange = (id: string, key: keyof LinkItem, value: string) => {
    setData((current) =>
      current
        ? {
            ...current,
            linkItems: current.linkItems.map((item) =>
              item.id === id ? { ...item, [key]: value } : item
            ),
          }
        : current
    );
  };

  const handleSaveLink = async (item: LinkItem) => {
    try {
      const response = await apiFetch<{ linkItem: LinkItem }>(
        `/api/app/profile-page/links/${item.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: item.title,
            description: item.description,
            favicon: item.favicon,
            url: item.url,
          }),
        }
      );

      updateCachedData((current) =>
        current
          ? {
              ...current,
              linkItems: current.linkItems.map((entry) =>
                entry.id === item.id ? response.linkItem : entry
              ),
            }
          : current
      );
      toast.success("Link updated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update link.");
    }
  };

  const handleDeleteLink = async (id: string) => {
    try {
      await apiFetch(`/api/app/profile-page/links/${id}`, {
        method: "DELETE",
      });
      updateCachedData((current) =>
        current
          ? {
              ...current,
              linkItems: current.linkItems
                .filter((item) => item.id !== id)
                .map((item, index) => ({ ...item, position: index })),
            }
          : current
      );
      toast.success("Link removed.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to remove link.");
    }
  };

  const handleCreateTextBox = async () => {
    try {
      setIsCreatingTextBox(true);
      const response = await apiFetch<{ textBoxItem: TextBoxItem }>(
        "/api/app/profile-page/text-boxes",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(newTextBox),
        }
      );

      updateCachedData((current) =>
        current
          ? {
              ...current,
              textBoxItems: [...current.textBoxItems, response.textBoxItem].sort(
                (a, b) => a.position - b.position
              ),
            }
          : current
      );
      setNewTextBox(createEmptyTextBoxItem());
      toast.success("Text box added.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add text box.");
    } finally {
      setIsCreatingTextBox(false);
    }
  };

  const handleTextBoxChange = (id: string, key: keyof TextBoxItem, value: string) => {
    setData((current) =>
      current
        ? {
            ...current,
            textBoxItems: current.textBoxItems.map((item) =>
              item.id === id ? { ...item, [key]: value } : item
            ),
          }
        : current
    );
  };

  const handleSaveTextBox = async (item: TextBoxItem) => {
    try {
      const response = await apiFetch<{ textBoxItem: TextBoxItem }>(
        `/api/app/profile-page/text-boxes/${item.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: item.title,
            description: item.description,
          }),
        }
      );

      updateCachedData((current) =>
        current
          ? {
              ...current,
              textBoxItems: current.textBoxItems.map((entry) =>
                entry.id === item.id ? response.textBoxItem : entry
              ),
            }
          : current
      );
      toast.success("Text box updated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update text box.");
    }
  };

  const handleDeleteTextBox = async (id: string) => {
    try {
      await apiFetch(`/api/app/profile-page/text-boxes/${id}`, {
        method: "DELETE",
      });
      updateCachedData((current) =>
        current
          ? {
              ...current,
              textBoxItems: current.textBoxItems
                .filter((item) => item.id !== id)
                .map((item, index) => ({ ...item, position: index })),
            }
          : current
      );
      toast.success("Text box removed.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to remove text box.");
    }
  };

  const persistLinkOrder = async (items: LinkItem[]) => {
    await apiFetch("/api/app/profile-page/links/reorder", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        orderedIds: items.map((item) => item.id),
      }),
    });
  };

  const persistTextBoxOrder = async (items: TextBoxItem[]) => {
    await apiFetch("/api/app/profile-page/text-boxes/reorder", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        orderedIds: items.map((item) => item.id),
      }),
    });
  };

  const handleLinkDragEnd = async (event: DragEndEvent) => {
    if (!data || !event.over || event.active.id === event.over.id) {
      return;
    }

    const oldIndex = data.linkItems.findIndex((item) => item.id === event.active.id);
    const newIndex = data.linkItems.findIndex((item) => item.id === event.over?.id);

    if (oldIndex < 0 || newIndex < 0) {
      return;
    }

    const nextItems = arrayMove(data.linkItems, oldIndex, newIndex).map((item, index) => ({
      ...item,
      position: index,
    }));
    const previousItems = data.linkItems;

    setData({
      ...data,
      linkItems: nextItems,
    });
    queryClient.setQueryData(profilePageQueryOptions().queryKey, {
      ...data,
      linkItems: nextItems,
    });

    try {
      await persistLinkOrder(nextItems);
    } catch (error) {
      setData({
        ...data,
        linkItems: previousItems,
      });
      queryClient.setQueryData(profilePageQueryOptions().queryKey, {
        ...data,
        linkItems: previousItems,
      });
      toast.error(error instanceof Error ? error.message : "Failed to reorder links.");
    }
  };

  const persistSocialLinkOrder = async (items: SocialLink[]) => {
    await apiFetch("/api/app/profile-page/social-links/reorder", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        orderedIds: items.map((item) => item.id),
      }),
    });
  };

  const handleSocialLinkDragEnd = async (event: DragEndEvent) => {
    if (!data || !event.over || event.active.id === event.over.id) {
      return;
    }

    const oldIndex = data.socialLinks.findIndex((item) => item.id === event.active.id);
    const newIndex = data.socialLinks.findIndex((item) => item.id === event.over?.id);

    if (oldIndex < 0 || newIndex < 0) {
      return;
    }

    const nextItems = arrayMove(data.socialLinks, oldIndex, newIndex).map((item, index) => ({
      ...item,
      position: index,
    }));
    const previousItems = data.socialLinks;

    setData({
      ...data,
      socialLinks: nextItems,
    });
    queryClient.setQueryData(profilePageQueryOptions().queryKey, {
      ...data,
      socialLinks: nextItems,
    });

    try {
      await persistSocialLinkOrder(nextItems);
    } catch (error) {
      setData({
        ...data,
        socialLinks: previousItems,
      });
      queryClient.setQueryData(profilePageQueryOptions().queryKey, {
        ...data,
        socialLinks: previousItems,
      });
      toast.error(error instanceof Error ? error.message : "Failed to reorder social links.");
    }
  };

  const handleTextBoxDragEnd = async (event: DragEndEvent) => {
    if (!data || !event.over || event.active.id === event.over.id) {
      return;
    }

    const oldIndex = data.textBoxItems.findIndex((item) => item.id === event.active.id);
    const newIndex = data.textBoxItems.findIndex((item) => item.id === event.over?.id);

    if (oldIndex < 0 || newIndex < 0) {
      return;
    }

    const nextItems = arrayMove(data.textBoxItems, oldIndex, newIndex).map((item, index) => ({
      ...item,
      position: index,
    }));
    const previousItems = data.textBoxItems;

    setData({
      ...data,
      textBoxItems: nextItems,
    });
    queryClient.setQueryData(profilePageQueryOptions().queryKey, {
      ...data,
      textBoxItems: nextItems,
    });

    try {
      await persistTextBoxOrder(nextItems);
    } catch (error) {
      setData({
        ...data,
        textBoxItems: previousItems,
      });
      queryClient.setQueryData(profilePageQueryOptions().queryKey, {
        ...data,
        textBoxItems: previousItems,
      });
      toast.error(error instanceof Error ? error.message : "Failed to reorder text boxes.");
    }
  };

  return {
    data,
    fallbackName,
    handleCreateLink,
    handleCreateTextBox,
    handleDeleteLink,
    handleDeleteTextBox,
    handleLinkDragEnd,
    handleLinkItemChange,
    handleProfileImageChange,
    handleProfileSave,
    handleSaveLink,
    handleSaveTextBox,
    handleDeleteSocialLink,
    handleSocialSave,
    handleSocialLinkDragEnd,
    handleTextBoxDragEnd,
    handleTextBoxChange,
    imageInputRef,
    isBooting: !data && profilePageQuery.isPending,
    isCreatingLink,
    isCreatingTextBox,
    isSavingProfile,
    isSavingSocial,
    isUserLoading,
    newLink,
    newTextBox,
    previewImageSrc,
    previewInitials,
    profileForm,
    profileImageUpload,
    sensors,
    setNewLink,
    setNewTextBox,
    setProfileForm,
    setSocialDrafts,
    socialDrafts,
  };
}
