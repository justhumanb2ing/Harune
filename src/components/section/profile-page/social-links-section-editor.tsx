"use client";

import { DndContext, closestCenter } from "@dnd-kit/core";
import { restrictToParentElement, restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { GripVertical } from "lucide-react";

import { SocialPlatformIcon } from "@/components/icon";

import { ProfilePageSectionLayout } from "@/components/section/profile-page/section-layout";
import { SortableShell } from "@/components/section/profile-page/sortable-shell";
import {
  socialPlatforms,
  useProfilePageEditor,
} from "@/components/section/profile-page/use-profile-page-editor";
import { InputGroup, InputGroupInput } from "@/components/ui/input-group";
import { MAX_SOCIAL_LINKS } from "@/lib/profile-page/types";

type SocialPlatformOption = (typeof socialPlatforms)[number];

export function SocialLinksSectionEditor() {
  const editor = useProfilePageEditor();
  const registeredSocialLinkCount = editor.selectedSocialLinkCount;
  const orderedSocialPlatforms: SocialPlatformOption[] = editor.data
    ? [
        ...editor.data.socialLinks
          .map((socialLink) =>
            socialPlatforms.find((platform) => platform.key === socialLink.platform)
          )
          .filter((platform): platform is SocialPlatformOption => platform !== undefined),
        ...socialPlatforms.filter(
          (platform) =>
            !editor.data?.socialLinks.some((socialLink) => socialLink.platform === platform.key)
        ),
      ]
    : socialPlatforms;

  const renderSocialLinkFields = (
    platform: SocialPlatformOption,
    isRegistrationDisabled: boolean
  ) => {
    return (
      <div className="flex items-center gap-3">
        <SocialPlatformIcon
          platform={platform.key}
          variant="color"
          className="size-10 shrink-0"
          aria-hidden="true"
        />
        <InputGroup className="h-11 flex-1 rounded-md border-0 bg-secondary">
          <InputGroupInput
            value={editor.socialDrafts[platform.key]}
            onChange={(event) => editor.setSocialUrl(platform.key, event.target.value)}
            placeholder={platform.key === "mail" ? platform.placeholder : "Add URL"}
            autoComplete="off"
            aria-label={platform.label}
            disabled={isRegistrationDisabled}
            className="h-full px-4!"
          />
        </InputGroup>
      </div>
    );
  };

  return (
    <ProfilePageSectionLayout
      title="Social"
      description="Add URLs for the platforms you want to show."
      isLoading={editor.isBooting || editor.isUserLoading}
      hasData={Boolean(editor.data)}
      padded={false}
    >
      {editor.data ? (
        <>
          <div className="relative flex min-h-0 w-full flex-1 flex-col justify-center bg-background lg:rounded-t-[2rem]">
            <div className="relative z-10 flex min-h-[46rem] w-full flex-col bg-background lg:rounded-t-[2rem]">
              <div className="flex w-full flex-col gap-3 bg-background pt-12 lg:mt-4 lg:rounded-t-[3rem] lg:p-4 lg:pt-12 lg:shadow-brand-small lg:ring-1 lg:ring-border/20">
                <p className="flex items-center justify-between mb-4">
                  <span className="font-medium text-lg">Available Social Links</span>
                  <span className="text-sm">
                    {registeredSocialLinkCount}/{MAX_SOCIAL_LINKS}
                  </span>
                </p>

                <DndContext
                  id="section-social-links"
                  sensors={editor.sensors}
                  collisionDetection={closestCenter}
                  modifiers={[restrictToVerticalAxis, restrictToParentElement]}
                  onDragEnd={(event) => void editor.handleSocialLinkDragEnd(event)}
                >
                  <SortableContext
                    items={editor.data.socialLinks.map((item) => item.platform)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="flex flex-col gap-3">
                      {orderedSocialPlatforms.map((platform) => {
                        const isRegistered = editor.socialDrafts[platform.key].trim().length > 0;
                        const isRegistrationDisabled =
                          !isRegistered && registeredSocialLinkCount >= MAX_SOCIAL_LINKS;

                        if (!isRegistered) {
                          return (
                            <div key={platform.key}>
                              {renderSocialLinkFields(platform, isRegistrationDisabled)}
                            </div>
                          );
                        }

                        return (
                          <SortableShell
                            key={platform.key}
                            id={platform.key}
                            className="shadow-none"
                          >
                            {({ attributes, listeners }) => (
                              <div className="group/item relative before:pointer-events-none before:absolute before:-inset-y-2 before:-left-9 before:-right-9 before:content-['']">
                                {renderSocialLinkFields(platform, isRegistrationDisabled)}
                                <button
                                  type="button"
                                  className="size-7 absolute top-1/2 -right-8 z-10 inline-flex -translate-y-1/2 cursor-grab items-center justify-center opacity-0 transition-opacity group-hover/item:opacity-100 bg-primary rounded-full shadow-sm border border-border/30"
                                  aria-label={`Reorder ${platform.label}`}
                                  {...attributes}
                                  {...listeners}
                                >
                                  <GripVertical className="text-primary-foreground size-4 stroke-3" />
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
              <div className="relative z-10 -mt-3 hidden min-h-20 flex-1 bg-background lg:block" />
            </div>
          </div>
        </>
      ) : null}
    </ProfilePageSectionLayout>
  );
}
