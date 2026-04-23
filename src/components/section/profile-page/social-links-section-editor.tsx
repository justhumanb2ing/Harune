"use client";

import {
  AppleMusicIcon,
  GithubIcon,
  InstagramIcon,
  LogoBehanceIcon,
  LogoThreadsIcon,
  MailIcon,
  SoundcloudLogoSolidIcon,
  SpotifyIcon,
  TiktokIcon,
  XTwitterIcon,
} from "@/components/icon";
import { DndContext, closestCenter } from "@dnd-kit/core";
import { restrictToParentElement, restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { GripVertical } from "lucide-react";
import { FaLinkedinIn, FaYoutube } from "react-icons/fa6";

import { ProfilePageSectionLayout } from "@/components/section/profile-page/section-layout";
import { SortableShell } from "@/components/section/profile-page/sortable-shell";
import {
  socialPlatforms,
  useProfilePageEditor,
} from "@/components/section/profile-page/use-profile-page-editor";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
import { MAX_SOCIAL_LINKS } from "@/lib/profile-page/types";
import { cn } from "@/lib/utils";

const socialPlatformIcons = {
  x: XTwitterIcon,
  instagram: InstagramIcon,
  youtube: FaYoutube,
  linkedin: FaLinkedinIn,
  github: GithubIcon,
  threads: LogoThreadsIcon,
  soundcloud: SoundcloudLogoSolidIcon,
  spotify: SpotifyIcon,
  behance: LogoBehanceIcon,
  tiktok: TiktokIcon,
  mail: MailIcon,
  apple_music: AppleMusicIcon,
} as const;

export function SocialLinksSectionEditor() {
  const editor = useProfilePageEditor();
  const socialLinksByPlatform = new Map(
    editor.data?.socialLinks.map((link) => [link.platform, link]) ?? []
  );
  const orderedSelectedPlatforms = socialPlatforms
    .filter((platform) => socialLinksByPlatform.has(platform.key))
    .sort((a, b) => {
      const aPosition = socialLinksByPlatform.get(a.key)?.position ?? Number.MAX_SAFE_INTEGER;
      const bPosition = socialLinksByPlatform.get(b.key)?.position ?? Number.MAX_SAFE_INTEGER;
      return aPosition - bPosition;
    });

  return (
    <ProfilePageSectionLayout
      title="Social"
      description="Select icons below to register platforms. Selected items stay synced even with an empty value."
      isLoading={editor.isBooting || editor.isUserLoading}
      hasData={Boolean(editor.data)}
    >
      {editor.data ? (
        <div className="space-y-3">
          <div className="flex flex-col gap-4">
            <div>
              {/* Count */}
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Available Social</span>
                <span className="font-medium">
                  {editor.selectedSocialLinkCount}/{MAX_SOCIAL_LINKS}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-4 pt-2 mb-16 px-4">
              {socialPlatforms.map((platform) => {
                const Icon = socialPlatformIcons[platform.key];
                const isSelected = socialLinksByPlatform.has(platform.key);
                const isSelectionDisabled =
                  !isSelected && editor.selectedSocialLinkCount >= MAX_SOCIAL_LINKS;

                return (
                  <button
                    key={platform.key}
                    type="button"
                    onClick={() => editor.toggleSocialLink(platform.key)}
                    disabled={editor.isSyncing}
                    aria-pressed={isSelected}
                    aria-label={`${platform.label} ${isSelected ? "등록 해제" : "등록"}`}
                    className={cn(
                      "inline-flex size-10 items-center justify-center rounded-full bg-background text-foreground shadow-brand transition-[transform,box-shadow,opacity] hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-50",
                      isSelected
                        ? "ring-2 ring-ring ring-offset-2 ring-foreground bg-background"
                        : "",
                      isSelectionDisabled ? "opacity-100" : ""
                    )}
                  >
                    <Icon className="size-5" aria-hidden="true" />
                  </button>
                );
              })}
            </div>
          </div>

          <DndContext
            sensors={editor.sensors}
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis, restrictToParentElement]}
            onDragEnd={(event) => void editor.handleSocialLinkDragEnd(event)}
          >
            <SortableContext
              items={orderedSelectedPlatforms.map((platform) => platform.key)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3">
                {orderedSelectedPlatforms.map((platform) => {
                  const Icon = socialPlatformIcons[platform.key];

                  return (
                    <SortableShell key={platform.key} id={platform.key}>
                      {({ attributes, listeners }) => (
                        <div className="group/item relative">
                          <InputGroup className="h-12 rounded-md border-0 bg-background shadow-brand has-[[data-slot=input-group-control]:focus-visible]:border-transparent has-[[data-slot=input-group-control]:focus-visible]:ring-0">
                            <InputGroupAddon className="pl-3">
                              <InputGroupText>
                                <Icon className="size-6 text-black" aria-hidden="true" />
                              </InputGroupText>
                            </InputGroupAddon>
                            <InputGroupInput
                              value={editor.socialDrafts[platform.key]}
                              onChange={(event) =>
                                editor.setSocialUrl(platform.key, event.target.value)
                              }
                              placeholder={platform.placeholder}
                              autoComplete="off"
                              aria-label={platform.label}
                              className="h-full px-0 pl-4!"
                            />
                          </InputGroup>
                          <button
                            type="button"
                            className="absolute top-1/2 -right-6 inline-flex -translate-y-1/2 cursor-grab items-center justify-center bg-transparent text-muted-foreground opacity-0 transition-opacity group-hover/item:opacity-100"
                            aria-label={`${platform.label} 순서 변경`}
                            {...attributes}
                            {...listeners}
                          >
                            <GripVertical className="size-4" />
                          </button>
                        </div>
                      )}
                    </SortableShell>
                  );
                })}
              </div>
            </SortableContext>
          </DndContext>

        </div>
      ) : null}
    </ProfilePageSectionLayout>
  );
}
