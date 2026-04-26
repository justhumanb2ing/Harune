"use client";

import { CheckIcon, ChevronRightIcon, Loader2Icon, XIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";

import {
  Dialog,
  DialogClose,
  DialogHeader,
  DialogPopup,
  DialogTitle,
  DialogTrigger,
} from "@/components/animate-ui/components/base/dialog";
import { useProfilePageEditor } from "@/components/section/profile-page/use-profile-page-editor";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
import { useProfilePageHandleAvailability } from "@/hooks/use-profile-page-handle-availability";
import { normalizeHandle, validateHandle } from "@/lib/handles";
import { cn } from "@/lib/utils";

function replaceHandleInPath(pathname: string, handle: string) {
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) {
    return `/${handle}/app`;
  }

  return `/${[handle, ...segments.slice(1)].join("/")}`;
}

export function ProfileHandleDialog() {
  const editor = useProfilePageEditor();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [handleDraft, setHandleDraft] = useState(editor.profileForm.handle);
  const [isSavingHandle, setIsSavingHandle] = useState(false);
  const initialHandle = normalizeHandle(editor.profileForm.handle);
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
    editor.isSyncing;

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    setHandleDraft(editor.profileForm.handle);
  };

  const handleSave = async () => {
    if (isHandleSaveDisabled || !editor.data) {
      return;
    }

    const nextDraftData = {
      ...editor.data,
      page: {
        ...editor.data.page,
        handle: currentHandle,
      },
    };
    editor.setProfileField("handle", currentHandle);
    const nextPath = replaceHandleInPath(pathname, currentHandle);
    setIsSavingHandle(true);
    const syncedData = await editor.handleSync(nextDraftData).finally(() => {
      setIsSavingHandle(false);
    });

    if (syncedData?.page.handle === currentHandle) {
      window.history.replaceState(window.history.state, "", nextPath);
      setIsOpen(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <Field className="relative rounded-lg bg-background py-4 shadow-brand outline-none">
        <FieldLabel className="block px-4 font-medium text-foreground text-xs uppercase">
          Handle
        </FieldLabel>
        <DialogTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              className="h-auto w-full justify-start px-4 py-2 font-medium hover:bg-transparent focus-visible:bg-background!"
              disabled={editor.isSyncing}
            >
              <div className="flex w-full items-center gap-1 text-left">
                <span className="text-muted-foreground text-sm">leeve.li/</span>
                <span
                  className={cn(
                    "flex-1 truncate text-sm",
                    editor.profileForm.handle ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {editor.profileForm.handle || "Handle"}
                </span>
                <ChevronRightIcon className="size-4 text-muted-foreground" />
              </div>
            </Button>
          }
        />
      </Field>

      <DialogPopup className="max-w-sm! gap-0 overflow-hidden p-0" showCloseButton={false}>
        <DialogHeader className="px-3 py-2">
          <div className="grid grid-cols-3 items-center">
            <DialogClose className="w-fit justify-self-start">
              <XIcon className="size-4" />
            </DialogClose>
            <DialogTitle className="justify-self-center font-semibold text-sm">Edit</DialogTitle>
            <button
              type="button"
              disabled={isHandleSaveDisabled}
              onClick={() => void handleSave()}
              className="w-fit justify-self-end text-right font-medium text-xs uppercase disabled:text-muted-foreground"
            >
              Save
            </button>
          </div>
        </DialogHeader>

        <div className="space-y-3 py-4">
          <Field className="relative rounded-lg bg-background outline-none">
            <InputGroup className="border-0 bg-background px-2 font-medium ring-0 has-[[data-slot=input-group-control]:focus-visible]:border-transparent has-[[data-slot=input-group-control]:focus-visible]:ring-0">
              <InputGroupInput
                id="profile-page-handle-dialog"
                placeholder="Handle"
                autoComplete="off"
                autoFocus
                value={handleDraft}
                onChange={(event) => setHandleDraft(event.target.value.toLowerCase())}
                className="px-0.5!"
              />
              <InputGroupAddon align="inline-start">
                <InputGroupText>leeve.li/</InputGroupText>
              </InputGroupAddon>
              <InputGroupAddon align="inline-end">
                {isCheckingAvailability ? (
                  <Loader2Icon className="size-4 animate-spin" />
                ) : hasChangedHandle && shouldShowState ? (
                  isHandleAvailable ? (
                    <CheckIcon className="size-4 text-emerald-600" />
                  ) : isHandleTaken ? (
                    <XIcon className="size-4 text-destructive" />
                  ) : null
                ) : null}
              </InputGroupAddon>
            </InputGroup>
          </Field>
        </div>
      </DialogPopup>
    </Dialog>
  );
}
