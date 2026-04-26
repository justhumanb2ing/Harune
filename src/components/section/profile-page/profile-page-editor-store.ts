"use client";

import { getProfileImageFileError } from "@/lib/profile-page/image-upload";
import { MAX_SOCIAL_LINKS } from "@/lib/profile-page/types";
import type {
  DraftLinkItem,
  DraftTextBoxItem,
  ProfilePageData,
  ProfilePageDraftData,
  ProfilePageSyncPayload,
  SocialPlatform,
} from "@/lib/profile-page/types";

type DirtyState = {
  backgroundImage: boolean;
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
  pendingBackgroundImageFile: File | null;
  pendingImageFile: File | null;
  previewBackgroundImageUrl: string | null;
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
  backgroundImage: false,
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
  pendingBackgroundImageFile: null,
  pendingImageFile: null,
  previewBackgroundImageUrl: null,
  previewImageUrl: null,
  syncError: null,
  syncStatus: "idle",
});

const createDraftId = () => `draft:${crypto.randomUUID()}`;
export const LINK_BLOCK_ID = "block:links";

const normalizeNullableText = (value: string | null | undefined) => value ?? "";
const hasTextBoxDraftContent = (value: NewTextBoxDraft) => value.title.trim().length > 0;
export const textBoxBlockId = (id: string) => `block:text:${id}`;

export type PageEditorBlock =
  | {
      id: typeof LINK_BLOCK_ID;
      position: number;
      type: "links";
    }
  | {
      id: string;
      position: number;
      textBoxId: string;
      type: "textBox";
    };

export const createDraftData = (data: ProfilePageData): ProfilePageDraftData => ({
  page: {
    id: data.page.id,
    handle: data.page.handle,
    linkBlockPosition: data.page.linkBlockPosition ?? 0,
    location: normalizeNullableText(data.page.location),
    name: normalizeNullableText(data.page.name),
    role: normalizeNullableText(data.page.role),
    bio: normalizeNullableText(data.page.bio),
    image: data.page.image,
    backgroundImage: data.page.backgroundImage,
  },
  socialLinks: data.socialLinks
    .filter((item) => item.url.trim().length > 0)
    .map((item, index) => ({
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
    blockPosition: item.blockPosition ?? index + 1,
  })),
});

export const getPageEditorBlocks = (draftData: ProfilePageDraftData): PageEditorBlock[] => {
  const linkBlock: PageEditorBlock = {
    id: LINK_BLOCK_ID,
    position: draftData.page.linkBlockPosition,
    type: "links",
  };

  return [
    linkBlock,
    ...draftData.textBoxItems.map((item) => ({
      id: textBoxBlockId(item.id),
      position: item.blockPosition,
      textBoxId: item.id,
      type: "textBox" as const,
    })),
  ].sort((a, b) => a.position - b.position);
};

const toComparableProfile = (draftData: ProfilePageDraftData) => ({
  handle: draftData.page.handle,
  linkBlockPosition: draftData.page.linkBlockPosition,
  location: draftData.page.location,
  name: draftData.page.name,
  role: draftData.page.role,
  bio: draftData.page.bio,
  image: draftData.page.image,
  backgroundImage: draftData.page.backgroundImage,
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
    blockPosition: item.blockPosition,
  }));

const recalculateDirtyState = (state: ProfilePageEditorState): ProfilePageEditorState => {
  if (!state.baseData || !state.draftData) {
    return {
      ...state,
      dirty: initialDirtyState(),
      hasUnsyncedChanges: Boolean(state.pendingImageFile || state.pendingBackgroundImageFile),
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
    backgroundImage:
      state.pendingBackgroundImageFile !== null ||
      baseDraft.page.backgroundImage !== state.draftData.page.backgroundImage,
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
    linkBlockPosition: draftData.page.linkBlockPosition,
    location: draftData.page.location,
    name: draftData.page.name,
    role: draftData.page.role,
    bio: draftData.page.bio,
    image: draftData.page.image,
    backgroundImage: draftData.page.backgroundImage,
  },
  socialLinks: draftData.socialLinks
    .filter((item) => item.url.trim().length > 0)
    .map((item, index) => ({
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
    blockPosition: item.blockPosition,
  })),
});

const getNextBlockPosition = (draftData: ProfilePageDraftData) =>
  Math.max(
    draftData.page.linkBlockPosition,
    ...draftData.textBoxItems.map((item) => item.blockPosition)
  ) + 1;

const replaceSocialLink = (
  socialLinks: ProfilePageDraftData["socialLinks"],
  platform: SocialPlatform,
  url: string
) => {
  const existing = socialLinks.find((item) => item.platform === platform);

  if (existing) {
    return socialLinks.map((item) => (item.platform === platform ? { ...item, url } : item));
  }

  return rebuildPositions([
    ...socialLinks,
    {
      platform,
      url,
      position: socialLinks.length,
    },
  ]);
};

const removeSocialLink = (
  socialLinks: ProfilePageDraftData["socialLinks"],
  platform: SocialPlatform
) => rebuildPositions(socialLinks.filter((item) => item.platform !== platform));

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

export function createProfilePageEditorStore(initialData?: ProfilePageData | null) {
  const listeners = new Set<() => void>();
  let state = initialData
    ? recalculateDirtyState({
        ...initialState(),
        baseData: initialData,
        draftData: createDraftData(initialData),
      })
    : initialState();

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
    pendingBackgroundImageFile: null,
    previewImageUrl: null,
    previewBackgroundImageUrl: null,
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
      revokePreviewUrl(state.previewBackgroundImageUrl);
      listeners.clear();
    },
    actions: {
      rebaseFromServer(data: ProfilePageData | null) {
        setState((current) => {
          revokePreviewUrl(current.previewImageUrl);
          revokePreviewUrl(current.previewBackgroundImageUrl);

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
      setProfileField(field: "bio" | "handle" | "location" | "name" | "role", value: string) {
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
              blockPosition: getNextBlockPosition(current.draftData),
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
            blockPosition: getNextBlockPosition(current.draftData),
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
      addNewTextBoxFromDraft(draft: NewTextBoxDraft) {
        setState((current) => {
          if (!current.draftData || draft.title.trim().length === 0) {
            return current;
          }

          const nextTextBoxItem: DraftTextBoxItem = {
            id: createDraftId(),
            title: draft.title.trim(),
            description: draft.description,
            position: current.draftData.textBoxItems.length,
            blockPosition: getNextBlockPosition(current.draftData),
          };

          return recalculateDirtyState({
            ...current,
            draftData: {
              ...current.draftData,
              textBoxItems: [...current.draftData.textBoxItems, nextTextBoxItem],
            },
            syncError: null,
          });
        });
      },
      updateTextBoxItem(
        id: string,
        field: keyof Omit<DraftTextBoxItem, "blockPosition" | "id" | "position">,
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
      reorderPageBlocks(activeId: string, overId: string) {
        setState((current) => {
          if (!current.draftData) {
            return current;
          }

          const blocks = getPageEditorBlocks(current.draftData);
          const oldIndex = blocks.findIndex((block) => block.id === activeId);
          const newIndex = blocks.findIndex((block) => block.id === overId);

          if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) {
            return current;
          }

          const nextBlocks = [...blocks];
          const [movedBlock] = nextBlocks.splice(oldIndex, 1);

          if (!movedBlock) {
            return current;
          }

          nextBlocks.splice(newIndex, 0, movedBlock);

          const blockPositions = new Map(nextBlocks.map((block, index) => [block.id, index]));
          const linkBlockPosition =
            blockPositions.get(LINK_BLOCK_ID) ?? current.draftData.page.linkBlockPosition;

          return recalculateDirtyState({
            ...current,
            draftData: {
              ...current.draftData,
              page: {
                ...current.draftData.page,
                linkBlockPosition,
              },
              textBoxItems: current.draftData.textBoxItems.map((item) => ({
                ...item,
                blockPosition: blockPositions.get(textBoxBlockId(item.id)) ?? item.blockPosition,
              })),
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

          const hasExistingSocialLink = current.draftData.socialLinks.some(
            (item) => item.platform === platform
          );

          if (
            url.trim() &&
            !hasExistingSocialLink &&
            current.draftData.socialLinks.length >= MAX_SOCIAL_LINKS
          ) {
            return current;
          }

          const nextSocialLinks = url.trim()
            ? replaceSocialLink(current.draftData.socialLinks, platform, url)
            : removeSocialLink(current.draftData.socialLinks, platform);

          return recalculateDirtyState({
            ...current,
            draftData: {
              ...current.draftData,
              socialLinks: nextSocialLinks,
            },
            syncError: null,
          });
        });
      },
      addSocialLink(_platform: SocialPlatform) {
        setState((current) => {
          if (!current.draftData) {
            return current;
          }

          return current;
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
              socialLinks: removeSocialLink(current.draftData.socialLinks, platform),
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
      selectBackgroundImage(file: File) {
        const validationError = getProfileImageFileError(file);

        if (validationError) {
          throw new Error(validationError);
        }

        setState((current) => {
          revokePreviewUrl(current.previewBackgroundImageUrl);
          const previewBackgroundImageUrl = URL.createObjectURL(file);

          return recalculateDirtyState({
            ...current,
            pendingBackgroundImageFile: file,
            previewBackgroundImageUrl,
            syncError: null,
          });
        });
      },
      removeBackgroundImage() {
        setState((current) => {
          if (!current.draftData) {
            return current;
          }

          revokePreviewUrl(current.previewBackgroundImageUrl);

          return recalculateDirtyState({
            ...current,
            draftData: {
              ...current.draftData,
              page: {
                ...current.draftData.page,
                backgroundImage: null,
              },
            },
            pendingBackgroundImageFile: null,
            previewBackgroundImageUrl: null,
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
