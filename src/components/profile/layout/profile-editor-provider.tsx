"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  createProfilePageEditorStore,
  type ProfilePageEditorState,
  type ProfilePageEditorStore,
} from "@/hooks/profile-editor-store";
import { useGetProfileByHandle } from "@/lib/api/generated/http/profile-api/profile-api";
import { toProfilePageEditorDataFromPublicPage } from "@/lib/profile/public-profile-page";
import type { ProfilePageData } from "@/lib/profile/types";

const ProfilePageEditorStoreContext = React.createContext<ProfilePageEditorStore | null>(null);

function useStoreSelector<T>(
  store: ProfilePageEditorStore,
  selector: (state: ProfilePageEditorState) => T
): T {
  const lastValueRef = React.useRef<{ state: ProfilePageEditorState; value: T } | null>(null);

  const getSnapshot = React.useCallback(() => {
    const state = store.getState();
    const previous = lastValueRef.current;

    if (previous && previous.state === state) {
      return previous.value;
    }

    const value = selector(state);
    lastValueRef.current = { state, value };
    return value;
  }, [selector, store]);

  return React.useSyncExternalStore(store.subscribe, getSnapshot, getSnapshot);
}

export function ProfilePageEditorProvider({
  children,
  initialData,
  handle,
}: {
  children: React.ReactNode;
  initialData: ProfilePageData | null;
  handle: string;
}) {
  const profilePageQuery = useGetProfileByHandle(handle, {
    query: {
      enabled: !!handle,
      select: (response) => {
        if (response.status !== 200) {
          throw new Error("Failed to load profile page.");
        }

        return toProfilePageEditorDataFromPublicPage(response.data.page);
      },
      staleTime: 0,
    },
  });
  const storeRef = React.useRef<ProfilePageEditorStore | null>(null);

  if (!storeRef.current) {
    storeRef.current = createProfilePageEditorStore(initialData ?? profilePageQuery.data ?? null);
  }

  const store = storeRef.current;
  const syncError = useStoreSelector(store, (state) => state.syncError);

  React.useEffect(() => {
    if (profilePageQuery.data === undefined) {
      return;
    }

    const currentState = store.getState();

    if (currentState.baseData === null || !currentState.hasUnsyncedChanges) {
      store.actions.rebaseFromServer(profilePageQuery.data);
    }
  }, [profilePageQuery.data, store]);

  React.useEffect(() => {
    if (!syncError) {
      return;
    }

    toast.error(syncError, { id: "profile-sync-error" });
    store.actions.setSyncError(null);
  }, [store, syncError]);

  React.useEffect(
    () => () => {
      store.destroy();
    },
    [store]
  );

  return (
    <ProfilePageEditorStoreContext.Provider value={store}>
      {children}
    </ProfilePageEditorStoreContext.Provider>
  );
}

export function useProfilePageEditorStore<T>(selector: (state: ProfilePageEditorState) => T): T {
  const store = React.useContext(ProfilePageEditorStoreContext);

  if (!store) {
    throw new Error("useProfilePageEditorStore must be used within ProfilePageEditorProvider");
  }

  return useStoreSelector(store, selector);
}

export function useProfilePageEditorStoreApi() {
  const store = React.useContext(ProfilePageEditorStoreContext);

  if (!store) {
    throw new Error("useProfilePageEditorStoreApi must be used within ProfilePageEditorProvider");
  }

  return store;
}

export function useOptionalProfilePageEditorStore<T>(
  selector: (state: ProfilePageEditorState) => T
): T | null {
  const store = React.useContext(ProfilePageEditorStoreContext);
  const lastValueRef = React.useRef<{ state: ProfilePageEditorState; value: T } | null>(null);

  const getSnapshot = React.useCallback(() => {
    if (!store) {
      return null;
    }

    const state = store.getState();
    const previous = lastValueRef.current;

    if (previous && previous.state === state) {
      return previous.value;
    }

    const value = selector(state);
    lastValueRef.current = { state, value };
    return value;
  }, [selector, store]);

  const subscribe = React.useCallback(
    (listener: () => void) => {
      if (!store) {
        return () => {};
      }

      return store.subscribe(listener);
    },
    [store]
  );

  return React.useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
