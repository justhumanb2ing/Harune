"use client";

import { CheckIcon, Loader2Icon, XIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";

import type { MeResponse } from "@/app/api/app/me/types";
import {
  Popover,
  PopoverPanel,
  PopoverTrigger,
} from "@/components/animate-ui/components/base/popover";
import {
  buildSyncPayload,
  createDraftData,
} from "@/components/section/profile-page/profile-page-editor-store";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
import { useProfilePageHandleAvailability } from "@/hooks/use-profile-page-handle-availability";
import { normalizeHandle, validateHandle } from "@/lib/handles";
import { profilePageQueryOptions } from "@/lib/profile-page/query-options";
import type { ProfilePageData } from "@/lib/profile-page/types";
import { apiFetch } from "@/lib/react-query/fetcher";
import { queryKeys } from "@/lib/react-query/query-keys";
import { useQuery, useQueryClient } from "@tanstack/react-query";

function replaceHandleInPath(pathname: string, handle: string) {
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) {
    return `/${handle}/app`;
  }

  return `/${[handle, ...segments.slice(1)].join("/")}`;
}

export function ChangeHandleButton() {
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const profilePageQuery = useQuery(profilePageQueryOptions());
  const profilePageData = profilePageQuery.data;
  const [isOpen, setIsOpen] = useState(false);
  const [handleDraft, setHandleDraft] = useState(profilePageData?.page.handle ?? "");
  const [isSavingHandle, setIsSavingHandle] = useState(false);
  const initialHandle = normalizeHandle(profilePageData?.page.handle ?? "");
  const currentHandle = normalizeHandle(handleDraft);
  const hasChangedHandle = currentHandle !== initialHandle;
  const handleValidationError = hasChangedHandle ? validateHandle(handleDraft) : null;
  const { isCheckingAvailability, isHandleAvailable, isHandleTaken, shouldShowState } =
    useProfilePageHandleAvailability(hasChangedHandle ? handleDraft : "");
  const isHandleSaveDisabled =
    !hasChangedHandle ||
    !!handleValidationError ||
    isCheckingAvailability ||
    !isHandleAvailable ||
    isSavingHandle ||
    profilePageQuery.isLoading ||
    !profilePageData;

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    setHandleDraft(profilePageData?.page.handle ?? "");
  };

  const handleSave = async () => {
    if (isHandleSaveDisabled || !profilePageData) {
      return;
    }

    const profilePageQueryKey = profilePageQueryOptions().queryKey;
    const draftData = createDraftData(profilePageData);
    const nextDraftData = {
      ...draftData,
      page: {
        ...draftData.page,
        handle: currentHandle,
      },
    };
    const nextPath = replaceHandleInPath(pathname, currentHandle);

    setIsSavingHandle(true);

    const syncedData = await apiFetch<ProfilePageData>("/api/app/profile-page/sync", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(buildSyncPayload(nextDraftData)),
    }).finally(() => {
      setIsSavingHandle(false);
    });

    if (syncedData.page.handle === currentHandle) {
      queryClient.setQueryData(profilePageQueryKey, syncedData);
      queryClient.setQueryData<MeResponse>(queryKeys.app.me(), (current) => {
        if (!current?.profilePage) {
          return current;
        }

        return {
          ...current,
          profilePage: {
            ...current.profilePage,
            handle: syncedData.page.handle,
            image: syncedData.page.image,
            name: syncedData.page.name,
          },
        };
      });
      window.history.replaceState(window.history.state, "", nextPath);
      setIsOpen(false);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            className="w-full justify-start px-4 py-6 font-normal"
            disabled={profilePageQuery.isLoading || !profilePageData}
          >
            Change handle
          </Button>
        }
      />
      <PopoverPanel
        align="center"
        side="right"
        sideOffset={16}
        data-setting-box-popover=""
        className="w-[var(--anchor-width)] min-w-80 gap-0 overflow-hidden rounded-2xl p-1 border-border/40 shadow-brand-small!"
      >
        <header>
          <h3 className="p-3 text-lg font-semibold">Pick a new handle ✨</h3>
        </header>

        <div className="space-y-2 p-3 pt-0">
          <Field className="relative rounded-lg bg-background outline-none">
            <InputGroup className="h-12 border-0 bg-secondary px-2 font-medium ring-0 has-[[data-slot=input-group-control]:focus-visible]:border-transparent has-[[data-slot=input-group-control]:focus-visible]:ring-0">
              <InputGroupInput
                id="profile-page-handle-popover"
                placeholder="Handle"
                autoComplete="off"
                autoFocus
                value={handleDraft}
                onChange={(event) => setHandleDraft(event.target.value.toLowerCase())}
                className="px-0.5!"
              />
              <InputGroupAddon align="inline-start">
                <InputGroupText className="text-primary">leeve.li/</InputGroupText>
              </InputGroupAddon>
              <InputGroupAddon align="inline-end">
                {isCheckingAvailability ? (
                  <Loader2Icon className="size-5 animate-spin" />
                ) : hasChangedHandle && shouldShowState ? (
                  isHandleAvailable ? (
                    <CheckIcon className="size-5 stroke-3 text-green-400" />
                  ) : isHandleTaken ? (
                    <XIcon className="size-5 text-destructive" />
                  ) : null
                ) : null}
              </InputGroupAddon>
            </InputGroup>
          </Field>
          <Button
            type="button"
            disabled={isHandleSaveDisabled}
            onClick={() => void handleSave()}
            className="w-full h-11 font-bold text-base  brand-button"
          >
            Change
          </Button>
        </div>
      </PopoverPanel>
    </Popover>
  );
}
