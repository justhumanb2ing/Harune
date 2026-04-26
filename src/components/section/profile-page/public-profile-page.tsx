import {
  ProfilePageAnalyticsTracker,
  TrackedProfilePageLink,
} from "@/components/analytics/profile-page-analytics-tracker";
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
import { Button } from "@/components/ui/button";
import type { LinkItem, SocialLink, SocialPlatform, TextBoxItem } from "@/lib/profile-page/types";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { FaLinkedinIn, FaYoutube } from "react-icons/fa6";
import { PublicProfileShareButton } from "./public-profile-share-button";

type PublicProfilePageProps = {
  backgroundImage: string | null;
  bio: string | null;
  handle: string;
  image: string | null;
  linkBlockPosition: number;
  linkItems: LinkItem[];
  location: string | null;
  name: string | null;
  profilePageId: string;
  role: string | null;
  socialLinks: SocialLink[];
  textBoxItems: TextBoxItem[];
  userName?: string | null;
};

const socialPlatformLabels: Record<SocialPlatform, string> = {
  x: "X",
  instagram: "Instagram",
  youtube: "YouTube",
  linkedin: "LinkedIn",
  github: "GitHub",
  threads: "Threads",
  soundcloud: "SoundCloud",
  spotify: "Spotify",
  behance: "Behance",
  tiktok: "TikTok",
  mail: "Email",
  apple_music: "Apple Music",
};

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

const socialHandleBaseUrls: Partial<Record<SocialPlatform, string>> = {
  x: "https://x.com/",
  instagram: "https://instagram.com/",
  youtube: "https://youtube.com/",
  linkedin: "https://linkedin.com/in/",
  github: "https://github.com/",
  threads: "https://www.threads.net/@",
  soundcloud: "https://soundcloud.com/",
  behance: "https://www.behance.net/",
  tiktok: "https://www.tiktok.com/@",
};

const byPosition = <T extends { position: number }>(a: T, b: T) => a.position - b.position;

function resolveFaviconUrl(favicon: string | null | undefined, pageUrl: string) {
  const value = favicon?.trim();

  if (!value) {
    return null;
  }

  if (value.startsWith("data:")) {
    return value;
  }

  try {
    return new URL(value, pageUrl).toString();
  } catch {
    return null;
  }
}

function hasExplicitUrlScheme(value: string) {
  return /^[a-z][a-z\d+.-]*:/i.test(value);
}

function resolveSocialHref(socialLink: SocialLink) {
  const value = socialLink.url.trim();

  if (!value) {
    return null;
  }

  if (socialLink.platform === "mail") {
    return hasExplicitUrlScheme(value) ? value : `mailto:${value}`;
  }

  if (hasExplicitUrlScheme(value)) {
    return value;
  }

  const baseUrl = socialHandleBaseUrls[socialLink.platform];

  if (!baseUrl) {
    return null;
  }

  return `${baseUrl}${value.replace(/^@/, "")}`;
}

function getContentBlocks({
  linkBlockPosition,
  linkItems,
  textBoxItems,
}: {
  linkBlockPosition: number;
  linkItems: LinkItem[];
  textBoxItems: TextBoxItem[];
}) {
  return [
    ...(linkItems.length > 0
      ? [
          {
            id: "links",
            linkItems,
            position: linkBlockPosition,
            type: "links" as const,
          },
        ]
      : []),
    ...textBoxItems.map((item) => ({
      id: item.id,
      item,
      position: item.blockPosition,
      type: "textBox" as const,
    })),
  ].sort((a, b) => a.position - b.position);
}

export function PublicProfilePage({
  backgroundImage,
  bio,
  handle,
  image,
  linkBlockPosition,
  linkItems,
  location,
  name,
  profilePageId,
  role,
  socialLinks,
  textBoxItems,
  userName,
}: PublicProfilePageProps) {
  const displayName = name;
  const contentBlocks = getContentBlocks({
    linkBlockPosition,
    linkItems: [...linkItems].sort(byPosition),
    textBoxItems: [...textBoxItems].sort(byPosition),
  });
  const orderedSocialLinks = [...socialLinks].sort(byPosition);

  return (
    <section className="mx-auto flex h-full min-h-full w-full items-start pb-8">
      <ProfilePageAnalyticsTracker
        displayName={name ?? userName ?? ""}
        handle={handle}
        profilePageId={profilePageId}
      />
      <PublicProfileShareButton />

      <div className="h-full w-full rounded-2xl bg-background flex flex-col">
        <div
          className={cn(
            "group relative flex h-60 items-center justify-center px-4",
            backgroundImage && "mb-20 h-60"
          )}
        >
          {backgroundImage ? (
            <img
              src={backgroundImage}
              alt=""
              className="pointer-events-none absolute inset-0 z-0 size-full object-cover"
            />
          ) : null}
          {image ? (
            <img
              src={image}
              alt={name ?? userName ?? ""}
              className={cn(
                "relative z-10 size-36 object-cover rounded-full",
                backgroundImage && "translate-y-18 sm:translate-y-28"
              )}
            />
          ) : null}
        </div>

        <div className="flex flex-col items-center justify-center gap-6 px-4 py-1 sm:flex-row">
          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-semibold tracking-tight">{name}</h1>
            {role || location ? (
              <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-sm text-neutral-600">
                {role ? <span>{role}</span> : null}
                {role && location ? <span aria-hidden="true">/</span> : null}
                {location ? <span>{location}</span> : null}
              </div>
            ) : null}
          </div>
        </div>

        {bio ? (
          <div className="px-4 py-1">
            <p className="whitespace-pre-line break-words text-center text-sm leading-7 text-neutral-800">
              {bio}
            </p>
          </div>
        ) : null}

        {orderedSocialLinks.length > 0 ? (
          <div className="mt-4 space-y-3 py-2 mb-6">
            <div className="flex items-center justify-center gap-3">
              {orderedSocialLinks.map((socialLink) => {
                const Icon = socialPlatformIcons[socialLink.platform];
                const label = socialPlatformLabels[socialLink.platform];

                return (
                  <TrackedProfilePageLink
                    key={socialLink.id}
                    href={socialLink.url}
                    aria-label={label}
                    className="inline-flex size-7 items-center justify-center rounded-full text-foreground group"
                    itemId={socialLink.id}
                    itemKind="social"
                    itemLabel={label}
                    platform={socialLink.platform}
                    profilePageId={profilePageId}
                  >
                    <Icon
                      className="size-full group-hover:scale-125 transition-transform"
                      aria-hidden="true"
                    />
                  </TrackedProfilePageLink>
                );
              })}
            </div>
          </div>
        ) : null}

        <div className="flex-1">
          {contentBlocks.map((block) => {
            if (block.type === "links") {
              return (
                <div key={block.id} className="space-y-3 px-4 py-4">
                  <div className="space-y-3">
                    {block.linkItems.map((item) => {
                      const faviconUrl = resolveFaviconUrl(item.favicon, item.url);

                      return (
                        <TrackedProfilePageLink
                          key={item.id}
                          href={item.url}
                          className="flex flex-col gap-2 rounded-md bg-background p-3 shadow-float"
                          itemId={item.id}
                          itemKind="link"
                          itemLabel={item.title}
                          profilePageId={profilePageId}
                        >
                          <div className="flex min-w-0 items-start gap-3 h-12">
                            <div className="h-full shrink-0">
                              {faviconUrl ? (
                                <img
                                  src={faviconUrl}
                                  alt={`${item.title || "Link"} favicon`}
                                  className="size-full rounded-sm object-contain"
                                />
                              ) : (
                                <div className="size-full" />
                              )}
                            </div>
                            <div className="flex min-w-0 items-center self-stretch">
                              <p className="flex-1 text-base leading-snug truncate line-clamp-1 font-medium">
                                {item.title}
                              </p>
                            </div>
                          </div>
                          {/*{item.description ? (
                            <div className="text-xs text-neutral-600">
                              <p className="break-words">{item.description}</p>
                            </div>
                          ) : null}*/}
                        </TrackedProfilePageLink>
                      );
                    })}
                  </div>
                </div>
              );
            }

            return (
              <div key={block.item.id} className="my-6 space-y-3">
                <div className="flex flex-col items-center px-5 py-4">
                  <p className="text-lg font-medium break-all text-center">{block.item.title}</p>
                  {block.item.description ? (
                    <p className="mt-1 break-all text-center text-base leading-6 text-neutral-800">
                      {block.item.description}
                    </p>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-12 text-xs flex items-center justify-center uppercase">
          <Button
            nativeButton={false}
            size={"sm"}
            variant={"link"}
            className={"text-neutral-500"}
            render={
              <Link href={"/sign-in"} className="">
                Create your page
              </Link>
            }
          />
        </div>
      </div>
    </section>
  );
}
