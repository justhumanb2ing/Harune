"use client";

import { getProfileImageFileError } from "@/lib/profile-page/image-upload";
import type {
  DraftLinkItem,
  DraftTextBoxItem,
  ProfilePageData,
  ProfilePageDraftData,
  ProfilePageSyncPayload,
  SocialPlatform,
} from "@/lib/profile-page/types";

type DirtyState = {
  image: boolean;
  linkItems: boolean;
  profile: boolean;
  socialLinks: boolean;
  textBoxItems: boolean;
};

type SyncStatus = "idle" | "syncing";

type NewLinkDraft = {
  description: string;
  favicon: string;
  title: string;
  url: string;
};

type NewTextBoxDraft = {
  description: string;
  title: string;
};

export type ProfilePageEditorState = {
  baseData: ProfilePageData | null;
  draftData: ProfilePageDraftData | null;
  dirty: DirtyState;
  hasUnsyncedChanges: boolean;
  newLink: NewLinkDraft;
  newTextBox: NewTextBoxDraft;
  newTextBoxId: string | null;
  pendingImageFile: File | null;
  previewImageUrl: string | null;
  syncError: string | null;
  syncStatus: SyncStatus;
};

type ProfilePageEditorStore = ReturnType<typeof createProfilePageEditorStore>;

const initialNewLink = (): NewLinkDraft => ({
  title: "",
  description: "",
  favicon: "",
  url: "",
});

const initialNewTextBox = (): NewTextBoxDraft => ({
  title: "",
  description: "",
});

const initialDirtyState = (): DirtyState => ({
  profile: false,
  socialLinks: false,
  linkItems: false,
  textBoxItems: false,
  image: false,
});

const initialState = (): ProfilePageEditorState => ({
  baseData: null,
  draftData: null,
  dirty: initialDirtyState(),
  hasUnsyncedChanges: false,
  newLink: initialNewLink(),
  newTextBox: initialNewTextBox(),
  newTextBoxId: null,
  pendingImageFile: null,
  previewImageUrl: null,
  syncError: null,
  syncStatus: "idle",
});

const createDraftId = () => `draft:${crypto.randomUUID()}`;

const normalizeNullableText = (value: string | null | undefined) => value ?? "";
const hasTextBoxDraftContent = (value: NewTextBoxDraft) => value.title.trim().length > 0;

export const createDraftData = (data: ProfilePageData): ProfilePageDraftData => ({
  page: {
    id: data.page.id,
    handle: data.page.handle,
    name: normalizeNullableText(data.page.name),
    bio: normalizeNullableText(data.page.bio),
    image: data.page.image,
  },
  socialLinks: data.socialLinks.map((item, index) => ({
    platform: item.platform,
    url: item.url,
    position: index,
  })),
  linkItems: data.linkItems.map((item, index) => ({
    id: item.id,
    title: item.title,
    description: normalizeNullableText(item.description),
    favicon: normalizeNullableText(item.favicon),
    url: item.url,
    position: index,
  })),
  textBoxItems: data.textBoxItems.map((item, index) => ({
    id: item.id,
    title: item.title,
    description: normalizeNullableText(item.description),
    position: index,
  })),
});

const toComparableProfile = (draftData: ProfilePageDraftData) => ({
  handle: draftData.page.handle,
  name: draftData.page.name,
  bio: draftData.page.bio,
  image: draftData.page.image,
});

const toComparableSocialLinks = (draftData: ProfilePageDraftData) =>
  draftData.socialLinks.map((item) => ({
    platform: item.platform,
    position: item.position,
    url: item.url,
  }));

const toComparableLinkItems = (draftData: ProfilePageDraftData) =>
  draftData.linkItems.map((item) => ({
    id: item.id,
    title: item.title,
    description: item.description,
    favicon: item.favicon,
    position: item.position,
    url: item.url,
  }));

const toComparableTextBoxItems = (draftData: ProfilePageDraftData) =>
  draftData.textBoxItems.map((item) => ({
    id: item.id,
    title: item.title,
    description: item.description,
    position: item.position,
  }));

const recalculateDirtyState = (state: ProfilePageEditorState): ProfilePageEditorState => {
  if (!state.baseData || !state.draftData) {
    return {
      ...state,
      dirty: initialDirtyState(),
      hasUnsyncedChanges: Boolean(state.pendingImageFile),
    };
  }

  const baseDraft = createDraftData(state.baseData);
  const dirty = {
    profile:
      JSON.stringify(toComparableProfile(baseDraft)) !==
      JSON.stringify(toComparableProfile(state.draftData)),
    socialLinks:
      JSON.stringify(toComparableSocialLinks(baseDraft)) !==
      JSON.stringify(toComparableSocialLinks(state.draftData)),
    linkItems:
      JSON.stringify(toComparableLinkItems(baseDraft)) !==
      JSON.stringify(toComparableLinkItems(state.draftData)),
    textBoxItems:
      JSON.stringify(toComparableTextBoxItems(baseDraft)) !==
      JSON.stringify(toComparableTextBoxItems(state.draftData)),
    image: state.pendingImageFile !== null || baseDraft.page.image !== state.draftData.page.image,
  };

  return {
    ...state,
    dirty,
    hasUnsyncedChanges: Object.values(dirty).some(Boolean),
  };
};

const rebuildPositions = <T extends { position: number }>(items: T[]) =>
  items.map((item, index) => ({
    ...item,
    position: index,
  }));

export const buildSyncPayload = (draftData: ProfilePageDraftData): ProfilePageSyncPayload => ({
  page: {
    handle: draftData.page.handle,
    name: draftData.page.name,
    bio: draftData.page.bio,
    image: draftData.page.image,
  },
  socialLinks: draftData.socialLinks.map((item, index) => ({
    platform: item.platform,
    position: index,
    url: item.url.trim(),
  })),
  linkItems: draftData.linkItems.map((item, index) => ({
    id: item.id,
    title: item.title,
    description: item.description,
    favicon: item.favicon,
    position: index,
    url: item.url,
  })),
  textBoxItems: draftData.textBoxItems.map((item, index) => ({
    id: item.id,
    title: item.title,
    description: item.description,
    position: index,
  })),
});

const replaceSocialLink = (
  socialLinks: ProfilePageDraftData["socialLinks"],
  platform: SocialPlatform,
  url: string
) => {
  const nextUrl = url;
  const existing = socialLinks.find((item) => item.platform === platform);

  if (!nextUrl.trim()) {
    return rebuildPositions(socialLinks.filter((item) => item.platform !== platform));
  }

  if (existing) {
    return socialLinks.map((item) =>
      item.platform === platform ? { ...item, url: nextUrl } : item
    );
  }

  return rebuildPositions([
    ...socialLinks,
    {
      platform,
      url: nextUrl,
      position: socialLinks.length,
    },
  ]);
};

const reorderItemsById = <T extends { id: string; position: number }>(
  items: T[],
  activeId: string,
  overId: string
) => {
  const oldIndex = items.findIndex((item) => item.id === activeId);
  const newIndex = items.findIndex((item) => item.id === overId);

  if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) {
    return items;
  }

  const nextItems = [...items];
  const [movedItem] = nextItems.splice(oldIndex, 1);

  if (!movedItem) {
    return items;
  }

  nextItems.splice(newIndex, 0, movedItem);
  return rebuildPositions(nextItems);
};

const revokePreviewUrl = (previewImageUrl: string | null) => {
  if (previewImageUrl) {
    URL.revokeObjectURL(previewImageUrl);
  }
};

export function createProfilePageEditorStore() {
  const listeners = new Set<() => void>();
  let state = initialState();

  const emit = () => {
    for (const listener of listeners) {
      listener();
    }
  };

  const setState = (updater: (current: ProfilePageEditorState) => ProfilePageEditorState) => {
    state = updater(state);
    emit();
  };

  const resetComposerState = (current: ProfilePageEditorState) => ({
    ...current,
    newLink: initialNewLink(),
    newTextBox: initialNewTextBox(),
    newTextBoxId: null,
    pendingImageFile: null,
    previewImageUrl: null,
    syncError: null,
    syncStatus: "idle" as const,
  });

  return {
    getState: () => state,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    destroy: () => {
      revokePreviewUrl(state.previewImageUrl);
      listeners.clear();
    },
    actions: {
      rebaseFromServer(data: ProfilePageData | null) {
        setState((current) => {
          revokePreviewUrl(current.previewImageUrl);

          if (!data) {
            return initialState();
          }

          return recalculateDirtyState({
            ...resetComposerState(current),
            baseData: data,
            draftData: createDraftData(data),
          });
        });
      },
      setProfileField(field: "bio" | "handle" | "name", value: string) {
        setState((current) => {
          if (!current.draftData) {
            return current;
          }

          return recalculateDirtyState({
            ...current,
            draftData: {
              ...current.draftData,
              page: {
                ...current.draftData.page,
                [field]: value,
              },
            },
            syncError: null,
          });
        });
      },
      setNewLink(updater: NewLinkDraft | ((current: NewLinkDraft) => NewLinkDraft)) {
        setState((current) => ({
          ...current,
          newLink: typeof updater === "function" ? updater(current.newLink) : updater,
        }));
      },
      setNewTextBox(updater: NewTextBoxDraft | ((current: NewTextBoxDraft) => NewTextBoxDraft)) {
        setState((current) => {
          const nextNewTextBox =
            typeof updater === "function" ? updater(current.newTextBox) : updater;

          if (!current.draftData) {
            return {
              ...current,
              newTextBox: nextNewTextBox,
            };
          }

          if (!current.newTextBoxId) {
            if (!hasTextBoxDraftContent(nextNewTextBox)) {
              return {
                ...current,
                newTextBox: nextNewTextBox,
              };
            }

            const nextTextBoxItem: DraftTextBoxItem = {
              id: createDraftId(),
              title: nextNewTextBox.title,
              description: nextNewTextBox.description,
              position: current.draftData.textBoxItems.length,
            };

            return recalculateDirtyState({
              ...current,
              draftData: {
                ...current.draftData,
                textBoxItems: [...current.draftData.textBoxItems, nextTextBoxItem],
              },
              newTextBox: nextNewTextBox,
              newTextBoxId: nextTextBoxItem.id,
              syncError: null,
            });
          }

          if (!hasTextBoxDraftContent(nextNewTextBox)) {
            return recalculateDirtyState({
              ...current,
              draftData: {
                ...current.draftData,
                textBoxItems: rebuildPositions(
                  current.draftData.textBoxItems.filter((item) => item.id !== current.newTextBoxId)
                ),
              },
              newTextBox: nextNewTextBox,
              newTextBoxId: null,
              syncError: null,
            });
          }

          return recalculateDirtyState({
            ...current,
            draftData: {
              ...current.draftData,
              textBoxItems: current.draftData.textBoxItems.map((item) =>
                item.id === current.newTextBoxId
                  ? {
                      ...item,
                      title: nextNewTextBox.title,
                      description: nextNewTextBox.description,
                    }
                  : item
              ),
            },
            newTextBox: nextNewTextBox,
            syncError: null,
          });
        });
      },
      addNewLink() {
        setState((current) => {
          if (!current.draftData) {
            return current;
          }

          const nextLinkItem: DraftLinkItem = {
            id: createDraftId(),
            title: current.newLink.title,
            description: current.newLink.description,
            favicon: current.newLink.favicon,
            url: current.newLink.url,
            position: current.draftData.linkItems.length,
          };

          return recalculateDirtyState({
            ...current,
            draftData: {
              ...current.draftData,
              linkItems: [...current.draftData.linkItems, nextLinkItem],
            },
            newLink: initialNewLink(),
            syncError: null,
          });
        });
      },
      updateLinkItem(
        id: string,
        field: keyof Omit<DraftLinkItem, "id" | "position">,
        value: string
      ) {
        setState((current) => {
          if (!current.draftData) {
            return current;
          }

          return recalculateDirtyState({
            ...current,
            draftData: {
              ...current.draftData,
              linkItems: current.draftData.linkItems.map((item) =>
                item.id === id ? { ...item, [field]: value } : item
              ),
            },
            syncError: null,
          });
        });
      },
      removeLinkItem(id: string) {
        setState((current) => {
          if (!current.draftData) {
            return current;
          }

          return recalculateDirtyState({
            ...current,
            draftData: {
              ...current.draftData,
              linkItems: rebuildPositions(
                current.draftData.linkItems.filter((item) => item.id !== id)
              ),
            },
            syncError: null,
          });
        });
      },
      reorderLinkItems(activeId: string, overId: string) {
        setState((current) => {
          if (!current.draftData) {
            return current;
          }

          return recalculateDirtyState({
            ...current,
            draftData: {
              ...current.draftData,
              linkItems: reorderItemsById(current.draftData.linkItems, activeId, overId),
            },
            syncError: null,
          });
        });
      },
      addNewTextBox() {
        setState((current) => {
          if (!current.draftData) {
            return current;
          }

          const nextTextBoxItem: DraftTextBoxItem = {
            id: createDraftId(),
            title: current.newTextBox.title,
            description: current.newTextBox.description,
            position: current.draftData.textBoxItems.length,
          };

          return recalculateDirtyState({
            ...current,
            draftData: {
              ...current.draftData,
              textBoxItems: [...current.draftData.textBoxItems, nextTextBoxItem],
            },
            newTextBox: initialNewTextBox(),
            syncError: null,
          });
        });
      },
      updateTextBoxItem(
        id: string,
        field: keyof Omit<DraftTextBoxItem, "id" | "position">,
        value: string
      ) {
        setState((current) => {
          if (!current.draftData) {
            return current;
          }

          return recalculateDirtyState({
            ...current,
            draftData: {
              ...current.draftData,
              textBoxItems: current.draftData.textBoxItems.map((item) =>
                item.id === id ? { ...item, [field]: value } : item
              ),
            },
            syncError: null,
          });
        });
      },
      removeTextBoxItem(id: string) {
        setState((current) => {
          if (!current.draftData) {
            return current;
          }

          return recalculateDirtyState({
            ...current,
            draftData: {
              ...current.draftData,
              textBoxItems: rebuildPositions(
                current.draftData.textBoxItems.filter((item) => item.id !== id)
              ),
            },
            newTextBox: current.newTextBoxId === id ? initialNewTextBox() : current.newTextBox,
            newTextBoxId: current.newTextBoxId === id ? null : current.newTextBoxId,
            syncError: null,
          });
        });
      },
      reorderTextBoxItems(activeId: string, overId: string) {
        setState((current) => {
          if (!current.draftData) {
            return current;
          }

          return recalculateDirtyState({
            ...current,
            draftData: {
              ...current.draftData,
              textBoxItems: reorderItemsById(current.draftData.textBoxItems, activeId, overId),
            },
            syncError: null,
          });
        });
      },
      resetNewTextBoxComposer() {
        setState((current) => {
          if (!hasTextBoxDraftContent(current.newTextBox)) {
            return current;
          }

          return {
            ...current,
            newTextBox: initialNewTextBox(),
            newTextBoxId: null,
            syncError: null,
          };
        });
      },
      setSocialUrl(platform: SocialPlatform, url: string) {
        setState((current) => {
          if (!current.draftData) {
            return current;
          }

          return recalculateDirtyState({
            ...current,
            draftData: {
              ...current.draftData,
              socialLinks: replaceSocialLink(current.draftData.socialLinks, platform, url),
            },
            syncError: null,
          });
        });
      },
      removeSocialLink(platform: SocialPlatform) {
        setState((current) => {
          if (!current.draftData) {
            return current;
          }

          return recalculateDirtyState({
            ...current,
            draftData: {
              ...current.draftData,
              socialLinks: rebuildPositions(
                current.draftData.socialLinks.filter((item) => item.platform !== platform)
              ),
            },
            syncError: null,
          });
        });
      },
      reorderSocialLinks(activePlatform: SocialPlatform, overPlatform: SocialPlatform) {
        setState((current) => {
          if (!current.draftData) {
            return current;
          }

          const oldIndex = current.draftData.socialLinks.findIndex(
            (item) => item.platform === activePlatform
          );
          const newIndex = current.draftData.socialLinks.findIndex(
            (item) => item.platform === overPlatform
          );

          if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) {
            return current;
          }

          const nextItems = [...current.draftData.socialLinks];
          const [movedItem] = nextItems.splice(oldIndex, 1);

          if (!movedItem) {
            return current;
          }

          nextItems.splice(newIndex, 0, movedItem);

          return recalculateDirtyState({
            ...current,
            draftData: {
              ...current.draftData,
              socialLinks: rebuildPositions(nextItems),
            },
            syncError: null,
          });
        });
      },
      selectImage(file: File) {
        const validationError = getProfileImageFileError(file);

        if (validationError) {
          throw new Error(validationError);
        }

        setState((current) => {
          revokePreviewUrl(current.previewImageUrl);
          const previewImageUrl = URL.createObjectURL(file);

          return recalculateDirtyState({
            ...current,
            pendingImageFile: file,
            previewImageUrl,
            syncError: null,
          });
        });
      },
      removeImage() {
        setState((current) => {
          if (!current.draftData) {
            return current;
          }

          revokePreviewUrl(current.previewImageUrl);

          return recalculateDirtyState({
            ...current,
            draftData: {
              ...current.draftData,
              page: {
                ...current.draftData.page,
                image: null,
              },
            },
            pendingImageFile: null,
            previewImageUrl: null,
            syncError: null,
          });
        });
      },
      setSyncStatus(syncStatus: SyncStatus) {
        setState((current) => ({
          ...current,
          syncStatus,
          syncError: syncStatus === "syncing" ? null : current.syncError,
        }));
      },
      setSyncError(syncError: string | null) {
        setState((current) => ({
          ...current,
          syncError,
          syncStatus: "idle",
        }));
      },
    },
  };
}

export type { ProfilePageEditorStore };
