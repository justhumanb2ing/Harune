"use client";

import {
  CheckIcon,
  ChevronRightIcon,
  CircleFadingArrowUpIcon,
  Loader2,
  Loader2Icon,
  TrashIcon,
  XIcon,
} from "lucide-react";
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
import { ProfilePageSectionLayout } from "@/components/section/profile-page/section-layout";
import { useProfilePageEditor } from "@/components/section/profile-page/use-profile-page-editor";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel, FieldSet } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import { useProfilePageHandleAvailability } from "@/hooks/use-profile-page-handle-availability";
import { normalizeHandle, validateHandle } from "@/lib/handles";
import { PROFILE_IMAGE_ACCEPT } from "@/lib/profile-page/image-upload";
import { cn } from "@/lib/utils";

function replaceHandleInPath(pathname: string, handle: string) {
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) {
    return `/${handle}/section`;
  }

  return `/${[handle, ...segments.slice(1)].join("/")}`;
}

export function ProfileSectionEditor() {
  const editor = useProfilePageEditor();
  const pathname = usePathname();
  const [isHandleDialogOpen, setIsHandleDialogOpen] = useState(false);
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
  const handleStatusMessage = handleValidationError
    ? handleValidationError
    : hasChangedHandle && isHandleTaken
      ? "This handle is already taken."
      : hasChangedHandle && isHandleAvailable
        ? "This handle is available."
        : null;

  const handleHandleDialogOpenChange = (open: boolean) => {
    setIsHandleDialogOpen(open);

    if (open) {
      setHandleDraft(editor.profileForm.handle);
      return;
    }

    setHandleDraft(editor.profileForm.handle);
  };

  const handleSaveHandle = async () => {
    if (isHandleSaveDisabled) {
      return;
    }

    if (!editor.data) {
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
      setIsHandleDialogOpen(false);
    }
  };

  return (
    <ProfilePageSectionLayout
      title="Profile"
      description="Name and handle are required. Bio can be cleared."
      isLoading={editor.isBooting || editor.isUserLoading}
      hasData={Boolean(editor.data)}
    >
      {editor.data ? (
        <div>
          <div className="space-y-5">
            <div className="flex flex-row items-center gap-2">
              <div className="group relative w-fit flex-1">
                <input
                  ref={editor.imageInputRef}
                  type="file"
                  accept={PROFILE_IMAGE_ACCEPT}
                  className="sr-only"
                  onChange={editor.handleProfileImageChange}
                />
                <Button
                  type="button"
                  variant="ghost"
                  className="relative size-28 overflow-hidden rounded-xl p-0 shadow-brand bg-background hover:bg-background"
                  onClick={() => editor.imageInputRef.current?.click()}
                  disabled={editor.isSyncing}
                  aria-label="Upload profile image"
                >
                  {editor.previewImageSrc ? (
                    <img
                      src={editor.previewImageSrc}
                      alt={editor.fallbackName}
                      className="size-full object-cover"
                    />
                  ) : (
                    <div className="flex size-full flex-col items-center justify-center gap-2 bg-background text-muted-foreground">
                      {editor.isSyncing ? (
                        <Loader2 className="size-5 animate-spin" />
                      ) : (
                        <CircleFadingArrowUpIcon className="size-5" />
                      )}
                      <span className="text-sm font-semibold tracking-tight">Upload</span>
                    </div>
                  )}
                </Button>
                {editor.previewImageSrc ? (
                  <Button
                    type="button"
                    size="icon-lg"
                    className="absolute -top-2 -right-2 z-10 rounded-full opacity-0 shadow-sm transition-all group-hover:scale-100 group-hover:opacity-100 bg-background hover:bg-secondary text-black"
                    disabled={editor.isSyncing}
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      editor.removeProfileImage();
                    }}
                    aria-label="Remove profile image"
                  >
                    <TrashIcon className="size-4" />
                  </Button>
                ) : null}
              </div>
              <div className="group relative w-fit flex-3">
                <input
                  ref={editor.backgroundImageInputRef}
                  type="file"
                  accept={PROFILE_IMAGE_ACCEPT}
                  className="sr-only"
                  onChange={editor.handleBackgroundImageChange}
                />
                <Button
                  type="button"
                  variant="ghost"
                  className="relative h-28 w-full overflow-hidden rounded-xl p-0 shadow-brand bg-background hover:bg-background"
                  onClick={() => editor.backgroundImageInputRef.current?.click()}
                  disabled={editor.isSyncing}
                  aria-label="Upload background image"
                >
                  {editor.previewBackgroundImageSrc ? (
                    <img
                      src={editor.previewBackgroundImageSrc}
                      alt=""
                      className="size-full object-cover"
                    />
                  ) : (
                    <div className="flex size-full flex-col items-center justify-center gap-2 bg-background text-muted-foreground">
                      {editor.isSyncing ? (
                        <Loader2 className="size-5 animate-spin" />
                      ) : (
                        <CircleFadingArrowUpIcon className="size-5" />
                      )}
                      <span className="text-sm font-semibold tracking-tight">Background Image</span>
                    </div>
                  )}
                </Button>
                {editor.previewBackgroundImageSrc ? (
                  <Button
                    type="button"
                    size="icon-lg"
                    className="absolute -top-2 -right-2 z-10 rounded-full opacity-0 shadow-sm transition-all group-hover:scale-100 group-hover:opacity-100 bg-background hover:bg-secondary text-black"
                    disabled={editor.isSyncing}
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      editor.removeBackgroundImage();
                    }}
                    aria-label="Remove background image"
                  >
                    <TrashIcon className="size-4" />
                  </Button>
                ) : null}
              </div>
            </div>

            <FieldGroup className="gap-8">
              <FieldSet className="gap-2">
                <FieldLabel className="uppercase text-xs text-muted-foreground">About</FieldLabel>
                <Field className="relative rounded-lg bg-background shadow-brand outline-none py-4">
                  <FieldLabel
                    htmlFor="profile-page-name"
                    className="block px-4 font-medium text-xs text-foreground uppercase"
                  >
                    Name
                  </FieldLabel>
                  <InputGroup className="bg-background border-0 px-1.5 font-medium ring-0 has-[[data-slot=input-group-control]:focus-visible]:border-transparent has-[[data-slot=input-group-control]:focus-visible]:ring-0">
                    <InputGroupInput
                      id="profile-page-name"
                      placeholder="My Name"
                      autoComplete="off"
                      className="text-sm"
                      value={editor.profileForm.name}
                      onChange={(event) => editor.setProfileField("name", event.target.value)}
                    />
                  </InputGroup>
                </Field>

                <Field className="relative rounded-lg bg-background outline-none py-4 shadow-brand">
                  <FieldLabel
                    htmlFor="profile-page-bio"
                    className="block px-4 font-medium text-xs text-foreground uppercase"
                  >
                    bio
                  </FieldLabel>
                  <InputGroup className="bg-background border-0 px-1.5 ring-0 has-[[data-slot=input-group-control]:focus-visible]:border-transparent has-[[data-slot=input-group-control]:focus-visible]:ring-0">
                    <InputGroupTextarea
                      id="profile-page-bio"
                      value={editor.profileForm.bio}
                      onChange={(event) => editor.setProfileField("bio", event.target.value)}
                      placeholder="Say something short about yourself."
                      className="min-h-12 resize-none text-sm"
                    />
                  </InputGroup>
                </Field>
              </FieldSet>

              <FieldSet className="gap-2">
                <FieldLabel className="uppercase text-xs text-muted-foreground">Additional</FieldLabel>
                <FieldGroup className="flex-row gap-2 items-center">
                  <Field className="flex-1 relative rounded-lg bg-background shadow-brand outline-none py-4">
                    <FieldLabel
                      htmlFor="profile-page-role"
                      className="block px-4 font-medium text-xs text-foreground uppercase"
                    >
                      Role
                    </FieldLabel>
                    <InputGroup className="bg-background border-0 px-1.5 font-medium ring-0 has-[[data-slot=input-group-control]:focus-visible]:border-transparent has-[[data-slot=input-group-control]:focus-visible]:ring-0">
                      <InputGroupInput
                        id="profile-page-role"
                        placeholder="Product Designer"
                        autoComplete="off"
                        className="text-sm"
                        value={editor.profileForm.role}
                        onChange={(event) => editor.setProfileField("role", event.target.value)}
                      />
                    </InputGroup>
                  </Field>
                  <Field className="flex-1 relative rounded-lg bg-background shadow-brand outline-none py-4">
                    <FieldLabel
                      htmlFor="profile-page-location"
                      className="block px-4 font-medium text-xs text-foreground uppercase"
                    >
                      Location
                    </FieldLabel>
                    <InputGroup className="bg-background border-0 px-1.5 font-medium ring-0 has-[[data-slot=input-group-control]:focus-visible]:border-transparent has-[[data-slot=input-group-control]:focus-visible]:ring-0">
                      <InputGroupInput
                        id="profile-page-location"
                        placeholder="Seoul, South Korea"
                        autoComplete="off"
                        className="text-sm"
                        value={editor.profileForm.location}
                        onChange={(event) => editor.setProfileField("location", event.target.value)}
                      />
                    </InputGroup>
                  </Field>
                </FieldGroup>
              </FieldSet>

              <FieldSet className="gap-2">
                <FieldLabel className="uppercase text-xs text-muted-foreground">Page</FieldLabel>
                <Dialog open={isHandleDialogOpen} onOpenChange={handleHandleDialogOpenChange}>
                  <Field className="relative rounded-lg bg-background shadow-brand outline-none py-4">
                    <FieldLabel className="block px-4 font-medium text-xs text-foreground uppercase">
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
                            <span className="text-sm text-muted-foreground">leeve.li/</span>
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
                        <DialogTitle className="justify-self-center text-sm font-semibold">
                          Edit
                        </DialogTitle>
                        <button
                          type="button"
                          disabled={isHandleSaveDisabled}
                          onClick={() => void handleSaveHandle()}
                          className="w-fit justify-self-end text-right text-xs font-medium uppercase disabled:text-muted-foreground"
                        >
                          Save
                        </button>
                      </div>
                    </DialogHeader>

                    <div className="space-y-3 py-4">
                      <Field className="relative rounded-lg bg-background outline-none">
                        <InputGroup className="bg-background border-0 px-2 font-medium ring-0 has-[[data-slot=input-group-control]:focus-visible]:border-transparent has-[[data-slot=input-group-control]:focus-visible]:ring-0">
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
              </FieldSet>

            </FieldGroup>

          </div>
        </div>
      ) : null}
    </ProfilePageSectionLayout>
  );
}
