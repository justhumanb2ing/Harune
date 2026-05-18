"use client";

import { CircleFadingArrowUpIcon, CropIcon, Loader2, TrashIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useProfilePageEditor } from "@/hooks/use-profile-editor";
import { preloadCropImageSource } from "@/lib/profile/image-crop";
import { PROFILE_IMAGE_ACCEPT } from "@/lib/profile/image-upload";
import { ProfileAvatarImage } from "./profile-avatar-image";
import { getProfileBentoProfileShellClassName } from "./profile-bento-profile-shell";
import { ProfileImageCropSurface } from "./profile-image-crop-surface";

export function ProfileBentoProfileEditor({
  initialUser,
  compactMode = false,
}: {
  initialUser?: Parameters<typeof useProfilePageEditor>[0];
  compactMode?: boolean;
}) {
  const editor = useProfilePageEditor(initialUser);
  const [isCropSurfaceOpen, setIsCropSurfaceOpen] = useState(false);

  const profileImageSrc = editor.previewImageSrc ?? editor.profileForm.image;
  const cropImageSrc = editor.cropImageSrc;
  const hasProfileImage = Boolean(profileImageSrc);

  useEffect(() => {
    if (!cropImageSrc) {
      return;
    }

    preloadCropImageSource(cropImageSrc);
  }, [cropImageSrc]);

  if (!editor.data) {
    return null;
  }

  const profileImageButtonClassName = compactMode
    ? "relative flex size-32 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-secondary transition-all hover:bg-input disabled:cursor-pointer disabled:opacity-100 disabled:hover:bg-secondary"
    : "relative flex size-32 xl:size-44 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-secondary transition-all hover:bg-input disabled:cursor-pointer disabled:opacity-100 disabled:hover:bg-secondary";
  const profileImageActionClassName = editor.isSyncing
    ? "hidden pointer-events-none absolute top-1 left-1 z-10 size-10 rounded-full border-[0.5px] border-border bg-background text-black shadow-sm transition-opacity hover:bg-secondary disabled:opacity-100 disabled:hover:bg-background"
    : "pointer-events-none absolute top-1 left-1 z-10 size-10 rounded-full border-[0.5px] border-border bg-background text-black opacity-0 shadow-sm transition-opacity hover:bg-secondary group-hover/profile-image:pointer-events-auto group-hover/profile-image:opacity-100 focus-visible:pointer-events-auto focus-visible:opacity-100 disabled:opacity-100 disabled:hover:bg-background";
  const profileImageRemoveClassName = editor.isSyncing
    ? "hidden pointer-events-none absolute top-1 right-1 z-10 size-10 rounded-full border-[0.5px] border-border bg-background text-black shadow-sm transition-opacity hover:bg-secondary disabled:opacity-100 disabled:hover:bg-background"
    : "pointer-events-none absolute top-1 right-1 z-10 size-10 rounded-full border-[0.5px] border-border bg-background text-black opacity-0 shadow-sm transition-opacity hover:bg-secondary group-hover/profile-image:pointer-events-auto group-hover/profile-image:opacity-100 focus-visible:pointer-events-auto focus-visible:opacity-100 disabled:opacity-100 disabled:hover:bg-background";
  const profileNameClassName = compactMode
    ? "min-h-8 resize-none overflow-hidden border-0 text-3xl! p-0!  tracking-tighter font-bold focus-visible:ring-0 rounded-none break-all"
    : "min-h-8 resize-none overflow-hidden border-0 text-3xl! xl:text-5xl! p-0! py-2! tracking-tighter font-bold focus-visible:ring-0 rounded-none break-all";
  const profileBioClassName = compactMode
    ? "min-h-20 resize-none overflow-hidden border-0 p-0! text-lg! text-neutral-800 break-all rounded-none focus-visible:ring-0"
    : "min-h-24 resize-none overflow-hidden border-0 p-0! text-lg! text-neutral-800 xl:text-xl! break-all rounded-none focus-visible:ring-0";

  return (
    <aside className={getProfileBentoProfileShellClassName(compactMode)}>
      <div className="flex flex-col gap-8 overflow-visible">
        <div className="flex px-4">
          <div className="group/profile-image relative overflow-visible">
            <button
              type="button"
              className={profileImageButtonClassName}
              onClick={() => editor.imageInputRef.current?.click()}
              disabled={editor.isSyncing || isCropSurfaceOpen}
              aria-label="Upload profile image"
            >
              {profileImageSrc ? (
                <ProfileAvatarImage
                  alt={editor.fallbackName}
                  className={isCropSurfaceOpen ? "size-full opacity-0" : "size-full"}
                  imageCrop={editor.profileForm.imageCrop}
                  src={profileImageSrc}
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
            {hasProfileImage ? (
              <Button
                type="button"
                size="icon-lg"
                className={profileImageActionClassName}
                disabled={editor.isSyncing || isCropSurfaceOpen}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  setIsCropSurfaceOpen(true);
                }}
                aria-label="Crop profile image"
              >
                <CropIcon className="size-5 stroke-3" />
              </Button>
            ) : null}
            {hasProfileImage ? (
              <Button
                type="button"
                size="icon-lg"
                className={profileImageRemoveClassName}
                disabled={editor.isSyncing || isCropSurfaceOpen}
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
            {isCropSurfaceOpen ? (
              <ProfileImageCropSurface
                imageSrc={cropImageSrc ?? null}
                initialCroppedAreaPixels={editor.profileForm.imageCrop?.croppedAreaPixels}
                onClose={() => setIsCropSurfaceOpen(false)}
                onApplied={({ imageCrop }) => {
                  editor.applyProfileImageCrop(imageCrop);
                }}
              />
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

        <div className="flex flex-col gap-1 p-4 pt-0">
          <Textarea
            id="v2-profile-name"
            value={editor.profileForm.name}
            onChange={(event) => editor.setProfileField("name", event.target.value)}
            placeholder="Your name"
            aria-label="Name"
            autoComplete="off"
            maxLength={100}
            className={profileNameClassName}
          />

          <Textarea
            id="v2-profile-bio"
            value={editor.profileForm.bio}
            onChange={(event) => editor.setProfileField("bio", event.target.value)}
            placeholder="Your bio"
            aria-label="Bio"
            className={profileBioClassName}
          />

          <div className="flex flex-col gap-1 text-neutral-500">
            <Input
              id="v2-profile-role"
              value={editor.profileForm.role}
              onChange={(event) => editor.setProfileField("role", event.target.value)}
              placeholder="What do you do?"
              aria-label="Role"
              autoComplete="off"
              className="h-fit border-0 text-base! py-0 px-0! focus-visible:ring-0 rounded-none"
            />
            <Input
              id="v2-profile-location"
              value={editor.profileForm.location}
              onChange={(event) => editor.setProfileField("location", event.target.value)}
              placeholder="Where are you based?"
              aria-label="Location"
              autoComplete="off"
              className="h-fit border-0 text-base! py-0 px-0! focus-visible:ring-0 rounded-none"
            />
          </div>
        </div>
      </div>
    </aside>
  );
}
