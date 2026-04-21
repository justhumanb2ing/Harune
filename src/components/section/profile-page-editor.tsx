"use client";

import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, ImageMinus, Loader2, Plus, Save, Trash2 } from "lucide-react";
import { type ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { S3Uploader } from "@/components/ui/s3-uploader";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch } from "@/lib/react-query/fetcher";
import useUser from "@/lib/users/useUser";

type SocialPlatform = "x" | "instagram" | "youtube" | "linkedin" | "github";

type SocialLink = {
  id: string;
  platform: SocialPlatform;
  url: string;
};

type LinkItem = {
  id: string;
  title: string;
  description: string | null;
  favicon: string | null;
  url: string;
  position: number;
};

type TextBoxItem = {
  id: string;
  title: string;
  description: string | null;
  position: number;
};

type ProfilePageData = {
  page: {
    id: string;
    handle: string;
    name: string | null;
    bio: string | null;
    image: string | null;
  };
  socialLinks: SocialLink[];
  linkItems: LinkItem[];
  textBoxItems: TextBoxItem[];
};

type ProfilePageResponse = ProfilePageData;

const socialPlatforms: Array<{ key: SocialPlatform; label: string; placeholder: string }> = [
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

function SortableShell({
  id,
  children,
}: {
  id: string;
  children: (args: {
    attributes: ReturnType<typeof useSortable>["attributes"];
    listeners: ReturnType<typeof useSortable>["listeners"];
  }) => ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
    >
      {children({ attributes, listeners })}
    </div>
  );
}

export function ProfilePageEditor() {
  const { user, isLoading: isUserLoading, mutate } = useUser();
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

  const [data, setData] = useState<ProfilePageData | null>(null);
  const [isBooting, setIsBooting] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingSocial, setIsSavingSocial] = useState<SocialPlatform | null>(null);
  const [isCreatingLink, setIsCreatingLink] = useState(false);
  const [isCreatingTextBox, setIsCreatingTextBox] = useState(false);
  const [profileForm, setProfileForm] = useState({
    handle: "",
    name: "",
    bio: "",
    image: null as string | null,
  });
  const [socialDrafts, setSocialDrafts] = useState<Record<SocialPlatform, string>>({
    x: "",
    instagram: "",
    youtube: "",
    linkedin: "",
    github: "",
  });
  const [newLink, setNewLink] = useState(createEmptyLinkItem());
  const [newTextBox, setNewTextBox] = useState(createEmptyTextBoxItem());

  const loadData = useCallback(async () => {
    const response = await apiFetch<ProfilePageResponse>("/api/app/profile-page");
    setData(response);
    setProfileForm({
      handle: response.page.handle,
      name: response.page.name ?? "",
      bio: response.page.bio ?? "",
      image: response.page.image ?? null,
    });
    setSocialDrafts({
      x: response.socialLinks.find((item) => item.platform === "x")?.url ?? "",
      instagram: response.socialLinks.find((item) => item.platform === "instagram")?.url ?? "",
      youtube: response.socialLinks.find((item) => item.platform === "youtube")?.url ?? "",
      linkedin: response.socialLinks.find((item) => item.platform === "linkedin")?.url ?? "",
      github: response.socialLinks.find((item) => item.platform === "github")?.url ?? "",
    });
  }, []);

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      try {
        await loadData();
      } catch (error) {
        if (!cancelled) {
          toast.error(error instanceof Error ? error.message : "Failed to load profile page.");
        }
      } finally {
        if (!cancelled) {
          setIsBooting(false);
        }
      }
    };

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, [loadData]);

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
  const previewImage = profileForm.image ?? "";
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
    try {
      setIsSavingProfile(true);
      const response = await apiFetch<{ page: ProfilePageData["page"] }>("/api/app/profile-page", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          handle: profileForm.handle,
          name: profileForm.name,
          bio: profileForm.bio,
          image: profileForm.image,
        }),
      });

      setData((prev) =>
        prev
          ? {
              ...prev,
              page: response.page,
            }
          : prev
      );
      await mutate();
      toast.success("Profile updated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update profile.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSocialSave = async (platform: SocialPlatform) => {
    const value = socialDrafts[platform].trim();

    try {
      setIsSavingSocial(platform);

      if (!value) {
        const existingId = socialLinkIdByPlatform.get(platform);

        if (existingId) {
          await apiFetch(`/api/app/profile-page/social-links/${existingId}`, {
            method: "DELETE",
          });
          setData((prev) =>
            prev
              ? {
                  ...prev,
                  socialLinks: prev.socialLinks.filter((item) => item.id !== existingId),
                }
              : prev
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

      setData((prev) => {
        if (!prev) {
          return prev;
        }

        const withoutPlatform = prev.socialLinks.filter((item) => item.platform !== platform);
        return {
          ...prev,
          socialLinks: [...withoutPlatform, response.socialLink],
        };
      });
      toast.success("Social link saved.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save social link.");
    } finally {
      setIsSavingSocial(null);
    }
  };

  const handleCreateLink = async () => {
    try {
      setIsCreatingLink(true);
      const response = await apiFetch<{ linkItem: LinkItem }>("/api/app/profile-page/links", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newLink),
      });

      setData((prev) =>
        prev
          ? {
              ...prev,
              linkItems: [...prev.linkItems, response.linkItem].sort(
                (a, b) => a.position - b.position
              ),
            }
          : prev
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
    setData((prev) =>
      prev
        ? {
            ...prev,
            linkItems: prev.linkItems.map((item) =>
              item.id === id ? { ...item, [key]: value } : item
            ),
          }
        : prev
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

      setData((prev) =>
        prev
          ? {
              ...prev,
              linkItems: prev.linkItems.map((entry) =>
                entry.id === item.id ? response.linkItem : entry
              ),
            }
          : prev
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
      await loadData();
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

      setData((prev) =>
        prev
          ? {
              ...prev,
              textBoxItems: [...prev.textBoxItems, response.textBoxItem].sort(
                (a, b) => a.position - b.position
              ),
            }
          : prev
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
    setData((prev) =>
      prev
        ? {
            ...prev,
            textBoxItems: prev.textBoxItems.map((item) =>
              item.id === id ? { ...item, [key]: value } : item
            ),
          }
        : prev
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

      setData((prev) =>
        prev
          ? {
              ...prev,
              textBoxItems: prev.textBoxItems.map((entry) =>
                entry.id === item.id ? response.textBoxItem : entry
              ),
            }
          : prev
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
      await loadData();
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

    try {
      await persistLinkOrder(nextItems);
    } catch (error) {
      setData({
        ...data,
        linkItems: previousItems,
      });
      toast.error(error instanceof Error ? error.message : "Failed to reorder links.");
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

    try {
      await persistTextBoxOrder(nextItems);
    } catch (error) {
      setData({
        ...data,
        textBoxItems: previousItems,
      });
      toast.error(error instanceof Error ? error.message : "Failed to reorder text boxes.");
    }
  };

  if (isBooting || isUserLoading) {
    return (
      <div className="flex min-h-[480px] items-center justify-center">
        <Loader2 className="size-8 animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <main className="mx-auto max-w-3xl space-y-3">
        <h1 className="text-3xl font-bold">Page editor</h1>
        <p className="text-muted-foreground">
          Complete onboarding before editing your public page.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Page editor</h1>
          <p className="text-muted-foreground">
            Edit your public profile, social links, links, and text boxes in one place.
          </p>
        </div>
        <a
          href={`/${data.page.handle}`}
          target="_blank"
          rel="noreferrer"
          className="text-sm font-medium underline-offset-4 hover:underline"
        >
          Open public page
        </a>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>Name and handle are required. Bio can be cleared.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <Avatar className="size-20">
                  <AvatarImage src={previewImage} alt={fallbackName} />
                  <AvatarFallback className="text-lg">{previewInitials}</AvatarFallback>
                </Avatar>
                <div className="flex flex-wrap gap-2">
                  <S3Uploader
                    presignedRouteProvider="/api/app/profile-page/upload-image"
                    variant="button"
                    onUpload={async (fileUrls) => {
                      const [url] = fileUrls;
                      if (url) {
                        setProfileForm((prev) => ({
                          ...prev,
                          image: url,
                        }));
                      }
                    }}
                    accept="image/*"
                    maxSize={5 * 1024 * 1024}
                    buttonText="Upload image"
                    buttonVariant="outline"
                    buttonSize="sm"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setProfileForm((prev) => ({
                        ...prev,
                        image: null,
                      }))
                    }
                  >
                    <ImageMinus className="size-4" />
                    Remove image
                  </Button>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="profile-page-name" className="text-sm font-medium">
                    Name
                  </label>
                  <Input
                    id="profile-page-name"
                    value={profileForm.name}
                    onChange={(event) =>
                      setProfileForm((prev) => ({
                        ...prev,
                        name: event.target.value,
                      }))
                    }
                    placeholder="Your display name"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="profile-page-handle" className="text-sm font-medium">
                    Handle
                  </label>
                  <Input
                    id="profile-page-handle"
                    value={profileForm.handle}
                    onChange={(event) =>
                      setProfileForm((prev) => ({
                        ...prev,
                        handle: event.target.value.toLowerCase(),
                      }))
                    }
                    placeholder="your_handle"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="profile-page-bio" className="text-sm font-medium">
                  Bio
                </label>
                <Textarea
                  id="profile-page-bio"
                  value={profileForm.bio}
                  onChange={(event) =>
                    setProfileForm((prev) => ({
                      ...prev,
                      bio: event.target.value,
                    }))
                  }
                  placeholder="Say something short about yourself."
                  className="min-h-28"
                />
              </div>

              <div className="flex justify-end">
                <Button
                  type="button"
                  onClick={() => void handleProfileSave()}
                  disabled={isSavingProfile}
                >
                  {isSavingProfile ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Save className="size-4" />
                  )}
                  Save profile
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Social links</CardTitle>
              <CardDescription>
                Use a full URL. Leaving a field empty removes that platform.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {socialPlatforms.map((platform) => (
                <div
                  key={platform.key}
                  className="grid gap-2 md:grid-cols-[120px_minmax(0,1fr)_96px]"
                >
                  <div className="flex items-center text-sm font-medium">{platform.label}</div>
                  <Input
                    value={socialDrafts[platform.key]}
                    onChange={(event) =>
                      setSocialDrafts((prev) => ({
                        ...prev,
                        [platform.key]: event.target.value,
                      }))
                    }
                    placeholder={platform.placeholder}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => void handleSocialSave(platform.key)}
                    disabled={isSavingSocial === platform.key}
                  >
                    {isSavingSocial === platform.key ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Save className="size-4" />
                    )}
                    Save
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Links</CardTitle>
              <CardDescription>Drag to reorder. Save each card after editing.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 rounded-xl border p-4">
                <Input
                  value={newLink.title}
                  onChange={(event) =>
                    setNewLink((prev) => ({ ...prev, title: event.target.value }))
                  }
                  placeholder="New link title"
                />
                <Input
                  value={newLink.url}
                  onChange={(event) => setNewLink((prev) => ({ ...prev, url: event.target.value }))}
                  placeholder="https://example.com"
                />
                <Input
                  value={newLink.favicon}
                  onChange={(event) =>
                    setNewLink((prev) => ({ ...prev, favicon: event.target.value }))
                  }
                  placeholder="https://example.com/favicon.ico"
                />
                <Textarea
                  value={newLink.description}
                  onChange={(event) =>
                    setNewLink((prev) => ({
                      ...prev,
                      description: event.target.value,
                    }))
                  }
                  placeholder="Description"
                />
                <div className="flex justify-end">
                  <Button
                    type="button"
                    onClick={() => void handleCreateLink()}
                    disabled={isCreatingLink}
                  >
                    {isCreatingLink ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Plus className="size-4" />
                    )}
                    Add link
                  </Button>
                </div>
              </div>

              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                modifiers={[restrictToVerticalAxis]}
                onDragEnd={(event) => void handleLinkDragEnd(event)}
              >
                <SortableContext
                  items={data.linkItems.map((item) => item.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-3">
                    {data.linkItems.map((item) => (
                      <SortableShell key={item.id} id={item.id}>
                        {({ attributes, listeners }) => (
                          <div className="rounded-xl border p-4">
                            <div className="mb-3 flex items-center justify-between">
                              <button
                                type="button"
                                className="inline-flex cursor-grab items-center text-muted-foreground"
                                {...attributes}
                                {...listeners}
                              >
                                <GripVertical className="size-4" />
                              </button>
                              <div className="flex gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => void handleSaveLink(item)}
                                >
                                  <Save className="size-4" />
                                  Save
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => void handleDeleteLink(item.id)}
                                >
                                  <Trash2 className="size-4" />
                                  Delete
                                </Button>
                              </div>
                            </div>
                            <div className="space-y-3">
                              <Input
                                value={item.title}
                                onChange={(event) =>
                                  handleLinkItemChange(item.id, "title", event.target.value)
                                }
                                placeholder="Title"
                              />
                              <Input
                                value={item.url}
                                onChange={(event) =>
                                  handleLinkItemChange(item.id, "url", event.target.value)
                                }
                                placeholder="https://example.com"
                              />
                              <Input
                                value={item.favicon ?? ""}
                                onChange={(event) =>
                                  handleLinkItemChange(item.id, "favicon", event.target.value)
                                }
                                placeholder="https://example.com/favicon.ico"
                              />
                              <Textarea
                                value={item.description ?? ""}
                                onChange={(event) =>
                                  handleLinkItemChange(item.id, "description", event.target.value)
                                }
                                placeholder="Description"
                              />
                            </div>
                          </div>
                        )}
                      </SortableShell>
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Text boxes</CardTitle>
              <CardDescription>
                Use text boxes for notes, context, and non-link content.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 rounded-xl border p-4">
                <Input
                  value={newTextBox.title}
                  onChange={(event) =>
                    setNewTextBox((prev) => ({
                      ...prev,
                      title: event.target.value,
                    }))
                  }
                  placeholder="New text box title"
                />
                <Textarea
                  value={newTextBox.description}
                  onChange={(event) =>
                    setNewTextBox((prev) => ({
                      ...prev,
                      description: event.target.value,
                    }))
                  }
                  placeholder="Description"
                />
                <div className="flex justify-end">
                  <Button
                    type="button"
                    onClick={() => void handleCreateTextBox()}
                    disabled={isCreatingTextBox}
                  >
                    {isCreatingTextBox ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Plus className="size-4" />
                    )}
                    Add text box
                  </Button>
                </div>
              </div>

              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                modifiers={[restrictToVerticalAxis]}
                onDragEnd={(event) => void handleTextBoxDragEnd(event)}
              >
                <SortableContext
                  items={data.textBoxItems.map((item) => item.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-3">
                    {data.textBoxItems.map((item) => (
                      <SortableShell key={item.id} id={item.id}>
                        {({ attributes, listeners }) => (
                          <div className="rounded-xl border p-4">
                            <div className="mb-3 flex items-center justify-between">
                              <button
                                type="button"
                                className="inline-flex cursor-grab items-center text-muted-foreground"
                                {...attributes}
                                {...listeners}
                              >
                                <GripVertical className="size-4" />
                              </button>
                              <div className="flex gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => void handleSaveTextBox(item)}
                                >
                                  <Save className="size-4" />
                                  Save
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => void handleDeleteTextBox(item.id)}
                                >
                                  <Trash2 className="size-4" />
                                  Delete
                                </Button>
                              </div>
                            </div>
                            <div className="space-y-3">
                              <Input
                                value={item.title}
                                onChange={(event) =>
                                  handleTextBoxChange(item.id, "title", event.target.value)
                                }
                                placeholder="Title"
                              />
                              <Textarea
                                value={item.description ?? ""}
                                onChange={(event) =>
                                  handleTextBoxChange(item.id, "description", event.target.value)
                                }
                                placeholder="Description"
                              />
                            </div>
                          </div>
                        )}
                      </SortableShell>
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </CardContent>
          </Card>
        </div>

        <Card className="h-fit lg:sticky lg:top-6">
          <CardHeader>
            <CardTitle>Preview</CardTitle>
            <CardDescription>Quick view of the current public page state.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <p className="text-lg font-semibold">{fallbackName}</p>
                <p className="text-sm text-muted-foreground">@{profileForm.handle}</p>
              </div>
              <Avatar className="size-14">
                <AvatarImage src={previewImage} alt={fallbackName} />
                <AvatarFallback>{previewInitials}</AvatarFallback>
              </Avatar>
            </div>
            <div className="rounded-xl bg-black px-4 py-3 text-white">
              <p className="text-xs uppercase tracking-[0.16em] text-white/60">Public URL</p>
              <p className="mt-1 text-sm font-medium">
                leeve.li / {profileForm.handle || data.page.handle}
              </p>
            </div>
            <p className="text-sm leading-6 text-muted-foreground">
              {profileForm.bio || "Bio not added yet"}
            </p>
            {data.socialLinks.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  Social
                </p>
                <div className="flex flex-wrap gap-2">
                  {data.socialLinks.map((item) => (
                    <span
                      key={item.id}
                      className="rounded-full border px-3 py-1 text-xs font-medium"
                    >
                      {item.platform}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
            <div className="grid gap-2 text-sm text-muted-foreground">
              <div>{data.linkItems.length} link items</div>
              <div>{data.textBoxItems.length} text boxes</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
