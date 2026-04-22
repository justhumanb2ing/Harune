"use client";

import {
  CheckIcon,
  CircleFadingArrowUpIcon,
  Loader2,
  Loader2Icon,
  TrashIcon,
  XIcon,
} from "lucide-react";

import { ProfilePageSectionLayout } from "@/components/section/profile-page/section-layout";
import { useProfilePageEditor } from "@/components/section/profile-page/use-profile-page-editor";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import { useProfilePageHandleAvailability } from "@/hooks/use-profile-page-handle-availability";
import { normalizeHandle } from "@/lib/handles";
import { PROFILE_IMAGE_ACCEPT } from "@/lib/profile-page/image-upload";

export function ProfileSectionEditor() {
  const editor = useProfilePageEditor();
  const initialHandle = normalizeHandle(editor.data?.page.handle ?? "");
  const currentHandle = normalizeHandle(editor.profileForm.handle);
  const hasChangedHandle = currentHandle !== initialHandle;
  const { isCheckingAvailability, isHandleAvailable, isHandleTaken, shouldShowState } =
    useProfilePageHandleAvailability(hasChangedHandle ? editor.profileForm.handle : "");

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
            <div className="flex flex-col gap-4">
              <div className="group relative w-fit">
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
                  className="relative size-28 overflow-hidden rounded-xl p-0 shadow-xs bg-background hover:bg-background"
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
            </div>

            {editor.syncError && <p className="text-destructive text-sm">{editor.syncError}</p>}

            <FieldGroup>
              <Field className="relative rounded-lg bg-background shadow-xs outline-none py-4">
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
              <Field className="relative rounded-lg bg-background shadow-xs outline-none py-4">
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
            </FieldGroup>
            <Field className="relative rounded-lg bg-background shadow-xs outline-none py-4">
              <FieldLabel
                htmlFor="profile-page-handle"
                className="block px-4 font-medium text-xs text-foreground uppercase"
              >
                Handle
              </FieldLabel>
              <InputGroup className="bg-background border-0 px-2 font-medium ring-0 has-[[data-slot=input-group-control]:focus-visible]:border-transparent has-[[data-slot=input-group-control]:focus-visible]:ring-0">
                <InputGroupInput
                  id="profile-page-handle"
                  placeholder="Handle"
                  autoComplete="off"
                  value={editor.profileForm.handle}
                  onChange={(event) =>
                    editor.setProfileField("handle", event.target.value.toLowerCase())
                  }
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
        </div>
      ) : null}
    </ProfilePageSectionLayout>
  );
}
