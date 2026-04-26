"use client";

import { CircleFadingArrowUpIcon, Loader2, TrashIcon } from "lucide-react";

import { ProfilePageSectionLayout } from "@/components/section/profile-page/section-layout";
import { useProfilePageEditor } from "@/components/section/profile-page/use-profile-page-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PROFILE_IMAGE_ACCEPT } from "@/lib/profile-page/image-upload";

export function ProfileSectionEditor() {
  const editor = useProfilePageEditor();

  return (
    <ProfilePageSectionLayout
      title="Profile"
      description="Name and handle are required. Bio can be cleared."
      isLoading={editor.isBooting || editor.isUserLoading}
      hasData={Boolean(editor.data)}
    >
      {editor.data ? (
        <div className="relative flex min-h-0 flex-1 flex-col justify-center rounded-t-[2rem] bg-background">
          <div className="relative z-10 flex min-h-[46rem] flex-col rounded-t-[2rem] bg-background">
            <div className="mt-4 flex flex-col gap-2 rounded-t-[3rem] bg-background shadow-brand-small ring-1 ring-border/20 border-b-0 overflow-hidden">
              <div className="group/background-image relative mb-16">
                <button
                  type="button"
                  className="relative flex h-52 w-full cursor-pointer items-center justify-center overflow-hidden rounded-t-[2rem] bg-secondary transition-colors hover:bg-input disabled:cursor-not-allowed disabled:opacity-70"
                  onClick={() =>
                    editor.backgroundImageInputRef.current?.click()
                  }
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
                    <span className="flex min-w-24 flex-col items-center justify-center gap-2 text-muted-foreground">
                      {editor.isSyncing ? (
                        <Loader2 className="size-6 animate-spin" />
                      ) : (
                        <CircleFadingArrowUpIcon className="size-6" />
                      )}
                      <span className="text-sm font-semibold">Background</span>
                    </span>
                  )}
                </button>
                <input
                  ref={editor.backgroundImageInputRef}
                  type="file"
                  accept={PROFILE_IMAGE_ACCEPT}
                  className="sr-only"
                  onChange={editor.handleBackgroundImageChange}
                  disabled={editor.isSyncing}
                />
                {editor.previewBackgroundImageSrc ? (
                  <Button
                    type="button"
                    size="icon-lg"
                    className="pointer-events-none absolute top-3 right-3 z-10 rounded-full border-[0.5px] border-border bg-background text-black opacity-0 shadow-sm transition-opacity hover:bg-secondary group-hover/background-image:pointer-events-auto group-hover/background-image:opacity-100 focus-visible:pointer-events-auto focus-visible:opacity-100"
                    disabled={editor.isSyncing}
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      editor.removeBackgroundImage();
                    }}
                    aria-label="Remove background image"
                  >
                    <TrashIcon className="size-4 stroke-3" />
                  </Button>
                ) : null}

                <div className="group/profile-image absolute bottom-0 left-1/2 z-10 -translate-x-1/2 translate-y-1/2">
                  <button
                    type="button"
                    className="relative flex size-32 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-secondary transition-colors hover:bg-input disabled:cursor-not-allowed disabled:opacity-70"
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
                      <span className="flex size-full flex-col items-center justify-center gap-2 text-muted-foreground rounded-full border-2 border-dashed">
                        {editor.isSyncing ? (
                          <Loader2 className="size-6 animate-spin" />
                        ) : (
                          <CircleFadingArrowUpIcon className="size-6" />
                        )}
                        <span className="text-sm font-semibold">Avatar</span>
                      </span>
                    )}
                  </button>
                  {editor.previewImageSrc ? (
                    <Button
                      type="button"
                      size="icon-lg"
                      className="pointer-events-none absolute -top-1 -right-1 z-10 rounded-full border-[0.5px] border-border bg-background text-black opacity-0 shadow-sm transition-opacity hover:bg-secondary group-hover/profile-image:pointer-events-auto group-hover/profile-image:opacity-100 focus-visible:pointer-events-auto focus-visible:opacity-100"
                      disabled={editor.isSyncing}
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        editor.removeProfileImage();
                      }}
                      aria-label="Remove profile image"
                    >
                      <TrashIcon className="size-4 stroke-3" />
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

              <div className="flex flex-col gap-2 p-4">
                <Input
                  id="profile-page-name"
                  value={editor.profileForm.name}
                  onChange={(event) =>
                    editor.setProfileField("name", event.target.value)
                  }
                  placeholder="Name"
                  aria-label="Name"
                  autoComplete="off"
                  className="h-12 border-0 bg-secondary text-center hover:bg-input"
                />

                <Textarea
                  id="profile-page-bio"
                  value={editor.profileForm.bio}
                  onChange={(event) =>
                    editor.setProfileField("bio", event.target.value)
                  }
                  placeholder="Bio"
                  aria-label="Bio"
                  className="h-48 resize-none border-0 bg-secondary p-4 hover:bg-input"
                />

                <div className="grid grid-cols-2 gap-2">
                  <Input
                    id="profile-page-role"
                    value={editor.profileForm.role}
                    onChange={(event) =>
                      editor.setProfileField("role", event.target.value)
                    }
                    placeholder="Role"
                    aria-label="Role"
                    autoComplete="off"
                    className="h-12 border-0 bg-secondary text-center hover:bg-input"
                  />
                  <Input
                    id="profile-page-location"
                    value={editor.profileForm.location}
                    onChange={(event) =>
                      editor.setProfileField("location", event.target.value)
                    }
                    placeholder="Location"
                    aria-label="Location"
                    autoComplete="off"
                    className="h-12 border-0 bg-secondary text-center hover:bg-input"
                  />
                </div>
              </div>
            </div>
            <div className="flex-1 bg-background" />
          </div>
        </div>
      ) : null}
    </ProfilePageSectionLayout>
  );
}
