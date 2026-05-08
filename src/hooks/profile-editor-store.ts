"use client";

import { getProfileImageFileError } from "@/lib/profile/image-upload";
import type {
  ProfilePageData,
  ProfilePageDraftData,
  ProfilePageSyncPayload,
} from "@/lib/profile/types";

type DirtyState = {
  backgroundImage: boolean;
  image: boolean;
  profile: boolean;
};

type SyncStatus = "idle" | "syncing";

export type ProfilePageEditorState = {
  baseData: ProfilePageData | null;
  draftData: ProfilePageDraftData | null;
  dirty: DirtyState;
  hasUnsyncedChanges: boolean;
  pendingBackgroundImageFile: File | null;
  pendingImageFile: File | null;
  previewBackgroundImageUrl: string | null;
  previewImageUrl: string | null;
  syncError: string | null;
  syncStatus: SyncStatus;
};

type ProfilePageEditorStore = ReturnType<typeof createProfilePageEditorStore>;

const initialDirtyState = (): DirtyState => ({
  profile: false,
  backgroundImage: false,
  image: false,
});

const initialState = (): ProfilePageEditorState => ({
  baseData: null,
  draftData: null,
  dirty: initialDirtyState(),
  hasUnsyncedChanges: false,
  pendingBackgroundImageFile: null,
  pendingImageFile: null,
  previewBackgroundImageUrl: null,
  previewImageUrl: null,
  syncError: null,
  syncStatus: "idle",
});

const normalizeNullableText = (value: string | null | undefined) => value ?? "";

export const createDraftData = (data: ProfilePageData): ProfilePageDraftData => ({
  page: {
    id: data.page.id,
    handle: data.page.handle,
    location: normalizeNullableText(data.page.location),
    name: normalizeNullableText(data.page.name),
    role: normalizeNullableText(data.page.role),
    bio: normalizeNullableText(data.page.bio),
    image: data.page.image,
    backgroundImage: data.page.backgroundImage,
  },
});

const toComparableProfile = (draftData: ProfilePageDraftData) => ({
  handle: draftData.page.handle,
  location: draftData.page.location,
  name: draftData.page.name,
  role: draftData.page.role,
  bio: draftData.page.bio,
  image: draftData.page.image,
  backgroundImage: draftData.page.backgroundImage,
});

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

export const buildSyncPayload = (draftData: ProfilePageDraftData): ProfilePageSyncPayload => ({
  page: {
    handle: draftData.page.handle,
    location: draftData.page.location,
    name: draftData.page.name,
    role: draftData.page.role,
    bio: draftData.page.bio,
    image: draftData.page.image,
    backgroundImage: draftData.page.backgroundImage,
  },
});

export function createProfilePageEditorStore(initialData?: ProfilePageData | null) {
  let state: ProfilePageEditorState = initialData
    ? recalculateDirtyState({
        ...initialState(),
        baseData: initialData,
        draftData: createDraftData(initialData),
      })
    : initialState();
  const listeners = new Set<() => void>();

  const emit = () => {
    for (const listener of listeners) {
      listener();
    }
  };

  const setState = (
    updater: ProfilePageEditorState | ((current: ProfilePageEditorState) => ProfilePageEditorState)
  ) => {
    state = typeof updater === "function" ? updater(state) : updater;
    emit();
  };

  const setDraft = (updater: (draftData: ProfilePageDraftData) => ProfilePageDraftData) => {
    setState((current) => {
      if (!current.draftData) {
        return current;
      }

      return recalculateDirtyState({
        ...current,
        draftData: updater(current.draftData),
      });
    });
  };

  const revokePreviewUrl = (url: string | null) => {
    if (url) {
      URL.revokeObjectURL(url);
    }
  };

  const store = {
    getState: () => state,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    destroy() {
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
            ...initialState(),
            baseData: data,
            draftData: createDraftData(data),
          });
        });
      },
      setSyncStatus(syncStatus: SyncStatus) {
        setState((current) => ({ ...current, syncStatus }));
      },
      setSyncError(syncError: string | null) {
        setState((current) => ({ ...current, syncError, syncStatus: "idle" }));
      },
      setProfileField(field: "bio" | "handle" | "location" | "name" | "role", value: string) {
        setDraft((draftData) => ({
          ...draftData,
          page: {
            ...draftData.page,
            [field]: value,
          },
        }));
      },
      selectImage(file: File) {
        const error = getProfileImageFileError(file);

        if (error) {
          throw new Error(error);
        }

        setState((current) => {
          revokePreviewUrl(current.previewImageUrl);

          return recalculateDirtyState({
            ...current,
            pendingImageFile: file,
            previewImageUrl: URL.createObjectURL(file),
          });
        });
      },
      removeImage() {
        setState((current) => {
          revokePreviewUrl(current.previewImageUrl);

          if (!current.draftData) {
            return {
              ...current,
              pendingImageFile: null,
              previewImageUrl: null,
            };
          }

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
          });
        });
      },
      selectBackgroundImage(file: File) {
        const error = getProfileImageFileError(file);

        if (error) {
          throw new Error(error);
        }

        setState((current) => {
          revokePreviewUrl(current.previewBackgroundImageUrl);

          return recalculateDirtyState({
            ...current,
            pendingBackgroundImageFile: file,
            previewBackgroundImageUrl: URL.createObjectURL(file),
          });
        });
      },
      removeBackgroundImage() {
        setState((current) => {
          revokePreviewUrl(current.previewBackgroundImageUrl);

          if (!current.draftData) {
            return {
              ...current,
              pendingBackgroundImageFile: null,
              previewBackgroundImageUrl: null,
            };
          }

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
          });
        });
      },
    },
  };

  return store;
}

export type { ProfilePageEditorStore };
