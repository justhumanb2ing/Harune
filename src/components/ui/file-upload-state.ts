"use client";

import * as React from "react";

export const ROOT_NAME = "FileUpload";

export type Direction = "ltr" | "rtl";

export interface FileState {
  file: File;
  progress: number;
  error?: string;
  status: "idle" | "uploading" | "error" | "success";
}

export interface StoreState {
  files: Map<File, FileState>;
  dragOver: boolean;
  invalid: boolean;
}

export type StoreAction =
  | { type: "ADD_FILES"; files: File[] }
  | { type: "SET_FILES"; files: File[] }
  | { type: "SET_PROGRESS"; file: File; progress: number }
  | { type: "SET_SUCCESS"; file: File }
  | { type: "SET_ERROR"; file: File; error: string }
  | { type: "REMOVE_FILE"; file: File }
  | { type: "SET_DRAG_OVER"; dragOver: boolean }
  | { type: "SET_INVALID"; invalid: boolean }
  | { type: "CLEAR" };

export interface FileUploadContextValue {
  inputId: string;
  dropzoneId: string;
  listId: string;
  labelId: string;
  disabled: boolean;
  dir: Direction;
  inputRef: React.RefObject<HTMLInputElement | null>;
  urlCache: WeakMap<File, string>;
}

function useLazyRef<T>(fn: () => T) {
  const ref = React.useRef<T | null>(null);

  if (ref.current === null) {
    ref.current = fn();
  }

  return ref as React.RefObject<T>;
}

const DirectionContext = React.createContext<Direction | undefined>(undefined);

export function useDirection(dirProp?: Direction): Direction {
  const contextDir = React.useContext(DirectionContext);
  return dirProp ?? contextDir ?? "ltr";
}

export function createStore(
  listeners: Set<() => void>,
  files: Map<File, FileState>,
  urlCache: WeakMap<File, string>,
  invalid: boolean,
  onValueChange?: (files: File[]) => void
) {
  let state: StoreState = {
    files,
    dragOver: false,
    invalid,
  };

  function reducer(nextState: StoreState, action: StoreAction): StoreState {
    switch (action.type) {
      case "ADD_FILES": {
        for (const file of action.files) {
          files.set(file, {
            file,
            progress: 0,
            status: "idle",
          });
        }

        onValueChange?.(Array.from(files.values()).map((fileState) => fileState.file));
        return { ...nextState, files };
      }

      case "SET_FILES": {
        const newFileSet = new Set(action.files);

        for (const existingFile of files.keys()) {
          if (!newFileSet.has(existingFile)) {
            files.delete(existingFile);
          }
        }

        for (const file of action.files) {
          if (!files.has(file)) {
            files.set(file, {
              file,
              progress: 0,
              status: "idle",
            });
          }
        }

        return { ...nextState, files };
      }

      case "SET_PROGRESS": {
        const fileState = files.get(action.file);
        if (fileState) {
          files.set(action.file, {
            ...fileState,
            progress: action.progress,
            status: "uploading",
          });
        }
        return { ...nextState, files };
      }

      case "SET_SUCCESS": {
        const fileState = files.get(action.file);
        if (fileState) {
          files.set(action.file, {
            ...fileState,
            progress: 100,
            status: "success",
          });
        }
        return { ...nextState, files };
      }

      case "SET_ERROR": {
        const fileState = files.get(action.file);
        if (fileState) {
          files.set(action.file, {
            ...fileState,
            error: action.error,
            status: "error",
          });
        }
        return { ...nextState, files };
      }

      case "REMOVE_FILE": {
        const cachedUrl = urlCache.get(action.file);
        if (cachedUrl) {
          URL.revokeObjectURL(cachedUrl);
          urlCache.delete(action.file);
        }

        files.delete(action.file);
        onValueChange?.(Array.from(files.values()).map((fileState) => fileState.file));
        return { ...nextState, files };
      }

      case "SET_DRAG_OVER": {
        return { ...nextState, dragOver: action.dragOver };
      }

      case "SET_INVALID": {
        return { ...nextState, invalid: action.invalid };
      }

      case "CLEAR": {
        for (const file of files.keys()) {
          const cachedUrl = urlCache.get(file);
          if (cachedUrl) {
            URL.revokeObjectURL(cachedUrl);
            urlCache.delete(file);
          }
        }

        files.clear();
        onValueChange?.([]);
        return { ...nextState, files, invalid: false };
      }

      default:
        return nextState;
    }
  }

  function getState() {
    return state;
  }

  function dispatch(action: StoreAction) {
    state = reducer(state, action);
    for (const listener of listeners) {
      listener();
    }
  }

  function subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  return { getState, dispatch, subscribe };
}

export const StoreContext = React.createContext<ReturnType<typeof createStore> | null>(null);

export function useStoreContext(consumerName: string) {
  const context = React.useContext(StoreContext);
  if (!context) {
    throw new Error(`\`${consumerName}\` must be used within \`${ROOT_NAME}\``);
  }
  return context;
}

export function useStore<T>(selector: (state: StoreState) => T): T {
  const store = useStoreContext(ROOT_NAME);
  const lastValueRef = useLazyRef<{ value: T; state: StoreState } | null>(() => null);

  const getSnapshot = React.useCallback(() => {
    const state = store.getState();
    const previous = lastValueRef.current;

    if (previous && previous.state === state) {
      return previous.value;
    }

    const value = selector(state);
    lastValueRef.current = { state, value };
    return value;
  }, [selector, store, lastValueRef]);

  return React.useSyncExternalStore(store.subscribe, getSnapshot, getSnapshot);
}

export const FileUploadContext = React.createContext<FileUploadContextValue | null>(null);

export function useFileUploadContext(consumerName: string) {
  const context = React.useContext(FileUploadContext);
  if (!context) {
    throw new Error(`\`${consumerName}\` must be used within \`${ROOT_NAME}\``);
  }
  return context;
}
