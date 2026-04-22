"use client";

import { GithubIcon, InstagramIcon, XTwitterIcon } from "@/components/icon";
import { DndContext, closestCenter } from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { XCircle } from "@phosphor-icons/react";
import { GripVertical, Loader2Icon, Save } from "lucide-react";
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
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";

const socialPlatformIcons = {
  x: XTwitterIcon,
  instagram: InstagramIcon,
  youtube: FaYoutube,
  linkedin: FaLinkedinIn,
  github: GithubIcon,
} as const;

export function SocialLinksSectionEditor() {
  const editor = useProfilePageEditor();
  const orderedPlatforms = socialPlatforms
    .filter((platform) => editor.data?.socialLinks.some((link) => link.platform === platform.key))
    .sort((a, b) => {
      const aPosition =
        editor.data?.socialLinks.find((link) => link.platform === a.key)?.position ??
        Number.MAX_SAFE_INTEGER;
      const bPosition =
        editor.data?.socialLinks.find((link) => link.platform === b.key)?.position ??
        Number.MAX_SAFE_INTEGER;
      return aPosition - bPosition;
    });
  const unsavedPlatforms = socialPlatforms.filter(
    (platform) => !editor.data?.socialLinks.some((link) => link.platform === platform.key)
  );

  return (
    <ProfilePageSectionLayout
      title="Social links"
      description="Use a full URL. Leaving a field empty removes that platform."
      isLoading={editor.isBooting || editor.isUserLoading}
      hasData={Boolean(editor.data)}
    >
      {editor.data ? (
        <div className="space-y-3">
          <DndContext
            sensors={editor.sensors}
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            onDragEnd={(event) => void editor.handleSocialLinkDragEnd(event)}
          >
            <SortableContext
              items={editor.data.socialLinks.map((item) => item.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3">
                {orderedPlatforms.map((platform) => {
                  const Icon = socialPlatformIcons[platform.key];
                  const socialLink = editor.data?.socialLinks.find(
                    (link) => link.platform === platform.key
                  );

                  if (!socialLink) {
                    return null;
                  }

                  return (
                    <SortableShell key={socialLink.id} id={socialLink.id}>
                      {({ attributes, listeners }) => (
                        <div className="group/item relative">
                          <button
                            type="button"
                            className="absolute top-1/2 -left-8 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-[min(var(--radius-md),12px)] text-muted-foreground opacity-0 outline-none transition-[opacity,background-color,color,box-shadow] group-hover/item:opacity-100 hover:bg-muted hover:text-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50"
                            onClick={() => void editor.handleDeleteSocialLink(platform.key)}
                            disabled={editor.isSavingSocial === platform.key}
                            aria-label={`${platform.label} 삭제`}
                          >
                            <XCircle
                              size={18}
                              weight="fill"
                              className="text-muted-foreground size-5"
                            />
                          </button>
                          <InputGroup className="h-12 rounded-md border-0 bg-background shadow-xs has-[[data-slot=input-group-control]:focus-visible]:border-transparent has-[[data-slot=input-group-control]:focus-visible]:ring-0">
                            <InputGroupAddon className="pl-3">
                              <InputGroupText>
                                <Icon className="size-6 text-black" aria-hidden="true" />
                              </InputGroupText>
                            </InputGroupAddon>
                            <InputGroupInput
                              value={editor.socialDrafts[platform.key]}
                              onChange={(event) =>
                                editor.setSocialDrafts((prev) => ({
                                  ...prev,
                                  [platform.key]: event.target.value,
                                }))
                              }
                              placeholder="Add handle or URL"
                              autoComplete="off"
                              aria-label={platform.label}
                              className="h-full px-0 pl-4!"
                            />
                            <InputGroupAddon align="inline-end" className="pr-3">
                              <InputGroupButton
                                type="button"
                                variant="default"
                                size="icon-sm"
                                onClick={() => void editor.handleSocialSave(platform.key)}
                                disabled={editor.isSavingSocial === platform.key}
                                aria-label={`${platform.label} 저장`}
                              >
                                {editor.isSavingSocial === platform.key ? (
                                  <Loader2Icon className="size-5 animate-spin" />
                                ) : (
                                  <Save className="size-5" />
                                )}
                              </InputGroupButton>
                            </InputGroupAddon>
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

          {unsavedPlatforms.map((platform) => {
            const Icon = socialPlatformIcons[platform.key];

            return (
              <div key={platform.key}>
                <InputGroup className="h-12 rounded-md border-0 bg-background shadow-xs has-[[data-slot=input-group-control]:focus-visible]:border-transparent has-[[data-slot=input-group-control]:focus-visible]:ring-0">
                  <InputGroupAddon className="pl-3">
                    <InputGroupText>
                      <Icon className="size-6 text-black" aria-hidden="true" />
                    </InputGroupText>
                  </InputGroupAddon>
                  <InputGroupInput
                    value={editor.socialDrafts[platform.key]}
                    onChange={(event) =>
                      editor.setSocialDrafts((prev) => ({
                        ...prev,
                        [platform.key]: event.target.value,
                      }))
                    }
                    placeholder="Add handle or URL"
                    autoComplete="off"
                    aria-label={platform.label}
                    className="h-full px-0 pl-4!"
                  />
                  <InputGroupAddon align="inline-end" className="pr-3">
                    <InputGroupButton
                      type="button"
                      variant="default"
                      size="icon-sm"
                      onClick={() => void editor.handleSocialSave(platform.key)}
                      disabled={editor.isSavingSocial === platform.key}
                      aria-label={`${platform.label} 저장`}
                    >
                      {editor.isSavingSocial === platform.key ? (
                        <Loader2Icon className="size-5 animate-spin" />
                      ) : (
                        <Save className="size-5" />
                      )}
                    </InputGroupButton>
                  </InputGroupAddon>
                </InputGroup>
              </div>
            );
          })}
        </div>
      ) : null}
    </ProfilePageSectionLayout>
  );
}
