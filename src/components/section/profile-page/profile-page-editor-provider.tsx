"use client";

import { profilePageQueryOptions } from "@/lib/profile-page/query-options";
import { useQuery } from "@tanstack/react-query";
import * as React from "react";

import {
  type ProfilePageEditorState,
  type ProfilePageEditorStore,
  createProfilePageEditorStore,
} from "@/components/section/profile-page/profile-page-editor-store";

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

export function ProfilePageEditorProvider({ children }: { children: React.ReactNode }) {
  const storeRef = React.useRef<ProfilePageEditorStore | null>(null);

  if (!storeRef.current) {
    storeRef.current = createProfilePageEditorStore();
  }

  const store = storeRef.current;
  const profilePageQuery = useQuery(profilePageQueryOptions());

  React.useEffect(() => {
    if (profilePageQuery.data === undefined) {
      return;
    }

    const currentState = store.getState();

    if (currentState.baseData === null || !currentState.hasUnsyncedChanges) {
      store.actions.rebaseFromServer(profilePageQuery.data);
    }
  }, [profilePageQuery.data, store]);

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

  if (!store) {
    return null;
  }

  return useStoreSelector(store, selector);
}
