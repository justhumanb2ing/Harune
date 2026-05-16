"use client";

import { CheckCircleIcon, SpinnerGapIcon, XCircleIcon } from "@phosphor-icons/react";
import { useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useProfilePageEditorStore } from "@/components/profile/layout/profile-editor-provider";
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
import { useUpdateHandle } from "@/lib/api/generated/http/handle-api/handle-api";
import { getGetMeQueryKey } from "@/lib/api/generated/http/me-api/me-api";
import type { getProfileByHandle } from "@/lib/api/generated/http/profile-api/profile-api";
import { getGetProfileByHandleQueryKey } from "@/lib/api/generated/http/profile-api/profile-api";
import type { GetMe200 } from "@/lib/api/generated/http/schemas/me-api";
import { normalizeHandle, validateHandle } from "@/lib/handles";
import { getProfileRouteHandle, replaceProfileRouteHandle } from "@/lib/profile/app-paths";
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
  const router = useRouter();
  const queryClient = useQueryClient();
  const routeHandle = getProfileRouteHandle(pathname);
  const profilePageData = useProfilePageEditorStore((state) => state.draftData ?? state.baseData);
  const { mutateAsync: updateHandle } = useUpdateHandle();
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
    !profilePageData;

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    setHandleDraft(profilePageData?.page.handle ?? "");
  };

  const handleSave = async () => {
    if (isHandleSaveDisabled || !profilePageData) {
      return;
    }

    const profilePageQueryKey = getGetProfileByHandleQueryKey(routeHandle);
    const nextPath = replaceProfileRouteHandle(pathname, currentHandle);

    setIsSavingHandle(true);

    try {
      const response = await updateHandle({
        data: {
          handle: currentHandle,
        },
      });

      if (response.status !== 200) {
        return;
      }

      const { data } = response;
      const currentProfileResponse =
        queryClient.getQueryData<Awaited<ReturnType<typeof getProfileByHandle>>>(
          profilePageQueryKey
        );

      if (currentProfileResponse?.status === 200) {
        const syncedProfileResponse = {
          ...currentProfileResponse,
          data: {
            ...currentProfileResponse.data,
            page: {
              ...currentProfileResponse.data.page,
              handle: data.profilePage.handle,
              image: data.profilePage.image,
              imageCrop: data.profilePage.imageCrop,
              name: data.profilePage.name,
            },
          },
        } satisfies Awaited<ReturnType<typeof getProfileByHandle>>;

        queryClient.setQueryData(profilePageQueryKey, syncedProfileResponse);
        queryClient.setQueryData(
          getGetProfileByHandleQueryKey(data.profilePage.handle),
          syncedProfileResponse
        );
      }
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
            imageCrop: data.profilePage.imageCrop,
            name: data.profilePage.name,
          },
        };
      });
      router.replace(nextPath);
      setIsOpen(false);
    } finally {
      setIsSavingHandle(false);
    }
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
            disabled={!profilePageData}
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
        className="w-[var(--anchor-width)] min-w-80 gap-0 overflow-hidden rounded-[1.5rem] border-border/40 p-1 shadow-brand-small!"
      >
        <header>
          <h3 className="p-3 text-lg font-semibold">Pick a new handle</h3>
        </header>

        <div className="space-y-2 p-3 pt-0">
          <Field className="relative rounded-lg bg-background outline-none">
            <InputGroup className="h-12 rounded-md border-0 bg-secondary px-2 font-medium ring-0 has-[[data-slot=input-group-control]:focus-visible]:border-transparent has-[[data-slot=input-group-control]:focus-visible]:ring-0">
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
              <InputGroupAddon align="inline-end" className="pr-1">
                {isCheckingAvailability ? (
                  <SpinnerGapIcon className="size-5 animate-spin" />
                ) : hasChangedHandle && shouldShowState ? (
                  isHandleAvailable ? (
                    <CheckCircleIcon weight="fill" className="size-6 stroke-3 text-green-500" />
                  ) : isHandleTaken ? (
                    <XCircleIcon weight="fill" className="size-6 text-red-500" />
                  ) : null
                ) : null}
              </InputGroupAddon>
            </InputGroup>
          </Field>
          <Button
            type="button"
            disabled={isHandleSaveDisabled}
            onClick={() => void handleSave()}
            className="brand-success-button h-11 w-full text-base font-bold"
          >
            Change
          </Button>
        </div>
      </PopoverPanel>
    </Popover>
  );
}
