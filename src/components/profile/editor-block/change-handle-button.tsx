"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckIcon, Loader2Icon, XIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Popover,
  PopoverPanel,
  type PopoverPanelProps,
  PopoverTrigger,
} from "@/components/ui/animate-ui/components/base/popover";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
import { useProfilePageHandleAvailability } from "@/hooks/use-profile-handle-availability";
import { updateHandle } from "@/lib/api/generated/http/handle-api/handle-api";
import { getGetMeQueryKey } from "@/lib/api/generated/http/me-api/me-api";
import type { GetMe200 } from "@/lib/api/generated/http/schemas/me-api";
import { normalizeHandle, validateHandle } from "@/lib/handles";
import { getProfileRouteHandle, replaceProfileRouteHandle } from "@/lib/profile/app-paths";
import { profilePageQueryOptions } from "@/lib/profile/query-options";
import type { ProfilePageData } from "@/lib/profile/types";
import { cn } from "@/lib/utils";

type ChangeHandleButtonProps = {
  panelAlign?: PopoverPanelProps["align"];
  panelCollisionAvoidance?: PopoverPanelProps["collisionAvoidance"];
  panelSide?: PopoverPanelProps["side"];
  panelSideOffset?: PopoverPanelProps["sideOffset"];
  triggerClassName?: string;
};

export function ChangeHandleButton({
  panelAlign = "center",
  panelCollisionAvoidance,
  panelSide = "right",
  panelSideOffset = 16,
  triggerClassName,
}: ChangeHandleButtonProps = {}) {
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const routeHandle = getProfileRouteHandle(pathname);
  const profilePageQuery = useQuery(profilePageQueryOptions(routeHandle));
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

    const profilePageQueryKey = profilePageQueryOptions(routeHandle).queryKey;
    const nextPath = replaceProfileRouteHandle(pathname, currentHandle);

    setIsSavingHandle(true);

    const response = await updateHandle({ handle: currentHandle }).finally(() => {
      setIsSavingHandle(false);
    });

    if (response.status !== 200) {
      return;
    }

    const { data } = response;

    const syncedData: ProfilePageData = {
      page: {
        ...profilePageData.page,
        ...data.profilePage,
      },
    };

    queryClient.setQueryData(profilePageQueryKey, syncedData);
    queryClient.setQueryData(profilePageQueryOptions(data.profilePage.handle).queryKey, syncedData);
    queryClient.setQueryData<GetMe200>(getGetMeQueryKey(), (current) => {
      if (!current?.profilePage) {
        return current;
      }

      return {
        ...current,
        profilePage: {
          ...current.profilePage,
          handle: data.profilePage.handle,
          image: data.profilePage.image,
          name: data.profilePage.name,
        },
      };
    });
    window.history.replaceState(window.history.state, "", nextPath);
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            className={cn(
              "h-16! w-full gap-1 flex-col rounded-lg! items-start px-4 py-6 font-normal",
              triggerClassName
            )}
            disabled={profilePageQuery.isLoading || !profilePageData}
          >
            <span>Change handle</span>
            <span className="text-xs text-neutral-600">/{handleDraft}</span>
          </Button>
        }
      />
      <PopoverPanel
        align={panelAlign}
        collisionAvoidance={panelCollisionAvoidance}
        side={panelSide}
        sideOffset={panelSideOffset}
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
                id="profile-handle-popover"
                placeholder="Handle"
                autoComplete="off"
                autoFocus
                value={handleDraft}
                onChange={(event) => setHandleDraft(event.target.value.toLowerCase())}
                className="px-0.5!"
              />
              <InputGroupAddon align="inline-start">
                <InputGroupText className="text-primary">harune.me/</InputGroupText>
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
