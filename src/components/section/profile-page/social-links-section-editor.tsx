"use client";

import {
  ColorAppleMusicIcon,
  ColorBehanceIcon,
  ColorGithubIcon,
  ColorInstagramIcon,
  ColorLinkedInIcon,
  ColorMailIcon,
  ColorSoundcloudIcon,
  ColorSpotifyIcon,
  ColorThreadsIcon,
  ColorTiktokIcon,
  ColorXTwitterIcon,
  ColorYoutubeIcon,
} from "@/components/icon";

import { ProfilePageSectionLayout } from "@/components/section/profile-page/section-layout";
import {
  socialPlatforms,
  useProfilePageEditor,
} from "@/components/section/profile-page/use-profile-page-editor";
import { InputGroup, InputGroupInput } from "@/components/ui/input-group";
import { MAX_SOCIAL_LINKS } from "@/lib/profile-page/types";

const socialPlatformIcons = {
  x: ColorXTwitterIcon,
  instagram: ColorInstagramIcon,
  youtube: ColorYoutubeIcon,
  linkedin: ColorLinkedInIcon,
  github: ColorGithubIcon,
  threads: ColorThreadsIcon,
  soundcloud: ColorSoundcloudIcon,
  spotify: ColorSpotifyIcon,
  behance: ColorBehanceIcon,
  tiktok: ColorTiktokIcon,
  mail: ColorMailIcon,
  apple_music: ColorAppleMusicIcon,
} as const;

export function SocialLinksSectionEditor() {
  const editor = useProfilePageEditor();
  const registeredSocialLinkCount = editor.selectedSocialLinkCount;

  return (
    <ProfilePageSectionLayout
      title="Social"
      description="Add URLs for the platforms you want to show."
      isLoading={editor.isBooting || editor.isUserLoading}
      hasData={Boolean(editor.data)}
    >
      {editor.data ? (
        <>
          <div className="relative flex min-h-0 flex-1 flex-col justify-center rounded-t-[2rem] bg-background">
            <div className="relative z-10 flex min-h-[46rem] flex-col rounded-t-[2rem] bg-background">
              <div className="mt-4 flex flex-col gap-3 rounded-t-[3rem] bg-background p-4 pt-12 shadow-brand-small ring-1 ring-border/20">
                <p className="flex items-center justify-between mb-4">
                  <span className="font-medium text-lg">Available Social Links</span>
                  <span className="text-sm">
                    {registeredSocialLinkCount}/{MAX_SOCIAL_LINKS}
                  </span>
                </p>

                {socialPlatforms.map((platform) => {
                  const Icon = socialPlatformIcons[platform.key];
                  const isRegistered = editor.socialDrafts[platform.key].trim().length > 0;
                  const isRegistrationDisabled =
                    !isRegistered && registeredSocialLinkCount >= MAX_SOCIAL_LINKS;

                  return (
                    <div key={platform.key} className="flex items-center gap-3">
                      <Icon className="size-10 shrink-0" aria-hidden="true" />
                      <InputGroup className="h-11 flex-1 rounded-md border-0 bg-secondary">
                        <InputGroupInput
                          value={editor.socialDrafts[platform.key]}
                          onChange={(event) =>
                            editor.setSocialUrl(platform.key, event.target.value)
                          }
                          placeholder={platform.key === "mail" ? platform.placeholder : "Add URL"}
                          autoComplete="off"
                          aria-label={platform.label}
                          disabled={isRegistrationDisabled}
                          className="h-full px-4!"
                        />
                      </InputGroup>
                    </div>
                  );
                })}
              </div>
              <div className="relative z-10 -mt-3 min-h-20 flex-1 bg-background" />
            </div>
          </div>
        </>
      ) : null}
    </ProfilePageSectionLayout>
  );
}
