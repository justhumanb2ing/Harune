"use client";

import { CircleFadingArrowUpIcon, Loader2, TrashIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useProfilePageEditor } from "@/hooks/use-profile-page-editor";
import { PROFILE_IMAGE_ACCEPT } from "@/lib/profile-page/image-upload";
import { ProfileBentoProfileMotion } from "./profile-bento-entry-motion";

export function ProfileBentoProfileEditor() {
  const editor = useProfilePageEditor();

  if (!editor.data) {
    return null;
  }

  return (
    <ProfileBentoProfileMotion className="flex w-[380px] max-w-full shrink-0 flex-col xl:sticky xl:top-[var(--v2-page-top-offset)] xl:min-w-[20rem] xl:w-[700px] xl:shrink">
      <div className="flex flex-col gap-12 overflow-hidden">
        <div className="flex px-4">
          <div className="group/profile-image relative">
            <button
              type="button"
              className="relative flex size-32 xl:size-44 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-secondary transition-colors hover:bg-input disabled:cursor-not-allowed disabled:opacity-70"
              onClick={() => editor.imageInputRef.current?.click()}
              disabled={editor.isSyncing}
              aria-label="Upload profile image"
            >
              {editor.previewImageSrc ? (
                // Object URLs and immediate local previews should render without Next image optimization.
                // biome-ignore lint/performance/noImgElement: This preview can be a blob URL.
                <img
                  src={editor.previewImageSrc}
                  alt={editor.fallbackName}
                  className="size-full object-cover"
                />
              ) : (
                <span className="flex size-full flex-col items-center justify-center gap-2 rounded-full  text-muted-foreground">
                  {editor.isSyncing ? (
                    <Loader2 className="size-6 animate-spin" />
                  ) : (
                    <CircleFadingArrowUpIcon className="size-6" />
                  )}
                  <span className="font-semibold text-lg">Avatar</span>
                </span>
              )}
            </button>
            {editor.previewImageSrc ? (
              <Button
                type="button"
                size="icon-lg"
                className="size-10 pointer-events-none absolute top-1 right-1 z-10 rounded-full border-[0.5px] border-border bg-background text-black opacity-0 shadow-sm transition-opacity hover:bg-secondary group-hover/profile-image:pointer-events-auto group-hover/profile-image:opacity-100 focus-visible:pointer-events-auto focus-visible:opacity-100"
                disabled={editor.isSyncing}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  editor.removeProfileImage();
                }}
                aria-label="Remove profile image"
              >
                <TrashIcon className="size-5 stroke-3" />
              </Button>
            ) : null}
          </div>
          <input
            ref={editor.imageInputRef}
            type="file"
            accept={PROFILE_IMAGE_ACCEPT}
            className="sr-only"
            onChange={editor.handleProfileImageChange}
            disabled={editor.isSyncing}
          />
        </div>

        <div className="flex flex-col gap-5 p-4 pt-0">
          <Textarea
            id="v2-profile-page-name"
            value={editor.profileForm.name}
            onChange={(event) => editor.setProfileField("name", event.target.value)}
            placeholder="Name"
            aria-label="Name"
            autoComplete="off"
            maxLength={100}
            className="min-h-8 resize-none overflow-hidden border-0 text-4xl! xl:text-5xl! p-0! font-bold focus-visible:ring-0 rounded-none break-all"
          />

          <Textarea
            id="v2-profile-page-bio"
            value={editor.profileForm.bio}
            onChange={(event) => editor.setProfileField("bio", event.target.value)}
            placeholder="Bio"
            aria-label="Bio"
            className="min-h-8 resize-none overflow-hidden border-0 p-0! text-lg! break-all rounded-none focus-visible:ring-0"
          />

          <div className="flex flex-col gap-2 text-neutral-500">
            <Input
              id="v2-profile-page-role"
              value={editor.profileForm.role}
              onChange={(event) => editor.setProfileField("role", event.target.value)}
              placeholder="What do you do?"
              aria-label="Role"
              autoComplete="off"
              className="h-fit border-0 text-base! p-0! focus-visible:ring-0 rounded-none"
            />
            <Input
              id="v2-profile-page-location"
              value={editor.profileForm.location}
              onChange={(event) => editor.setProfileField("location", event.target.value)}
              placeholder="Where are you based?"
              aria-label="Location"
              autoComplete="off"
              className="h-fit border-0 text-base! p-0! focus-visible:ring-0 rounded-none"
            />
          </div>
        </div>
      </div>
    </ProfileBentoProfileMotion>
  );
}
