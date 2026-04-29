import Link from "next/link";
import { SocialPlatformIcon, socialPlatformLabels } from "@/components/icons";
import { PlaylistIframe } from "@/components/profile-page/playlist-iframe";
import {
  ProfilePageAnalyticsTracker,
  TrackedProfilePageLink,
} from "@/components/site-instrumentation/profile-page-analytics-tracker";
import { Button } from "@/components/ui/button";
import type {
  LinkItem,
  PlaylistItem,
  SocialLink,
  SocialPlatform,
  TextBoxItem,
} from "@/lib/profile-page/types";
import { cn } from "@/lib/utils";
import {
  PublicProfileAvatarMotion,
  PublicProfileBackgroundImageMotion,
  PublicProfileReveal,
  PublicProfileStagger,
} from "./live-page-motion";
import { PublicProfileShareButton } from "./live-page-share-button";

type PublicProfilePageProps = {
  backgroundImage: string | null;
  bio: string | null;
  handle: string;
  image: string | null;
  linkBlockPosition: number;
  linkItems: LinkItem[];
  playlistItems: PlaylistItem[];
  location: string | null;
  name: string | null;
  profilePageId: string;
  role: string | null;
  socialLinks: SocialLink[];
  textBoxItems: TextBoxItem[];
  userName?: string | null;
};

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
    return value.toLowerCase().startsWith("mailto:") ? value : `mailto:${value}`;
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
  playlistItems,
  textBoxItems,
}: {
  linkBlockPosition: number;
  linkItems: LinkItem[];
  playlistItems: PlaylistItem[];
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
    ...playlistItems.map((item) => ({
      id: item.id,
      item,
      position: item.blockPosition,
      type: "playlist" as const,
    })),
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
  playlistItems,
  location,
  name,
  profilePageId,
  role,
  socialLinks,
  textBoxItems,
  userName,
}: PublicProfilePageProps) {
  const contentBlocks = getContentBlocks({
    linkBlockPosition,
    linkItems: [...linkItems].sort(byPosition),
    playlistItems: [...playlistItems].sort(byPosition),
    textBoxItems: [...textBoxItems].sort(byPosition),
  });
  const orderedSocialLinks = [...socialLinks].sort(byPosition);

  return (
    <section className="mx-auto flex min-h-lvh w-full items-start">
      <ProfilePageAnalyticsTracker
        displayName={name ?? userName ?? ""}
        handle={handle}
        profilePageId={profilePageId}
      />

      <div className="relative flex min-h-lvh w-full flex-col rounded-2xl bg-background">
        <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 mx-auto max-w-lg px-4">
          <PublicProfileReveal className="flex justify-end" delay={0.62} y={8}>
            <PublicProfileShareButton />
          </PublicProfileReveal>
        </div>

        <div
          className={cn(
            "group relative flex h-60 items-center justify-center px-4",
            backgroundImage && "mb-20 h-60"
          )}
        >
          {backgroundImage ? (
            <PublicProfileBackgroundImageMotion
              src={backgroundImage}
              alt=""
              className="pointer-events-none absolute inset-0 z-0 size-full object-cover"
            />
          ) : null}
          {image ? (
            <div
              className={cn(
                "relative z-10 size-36",
                backgroundImage && "absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2"
              )}
            >
              <PublicProfileAvatarMotion
                src={image}
                alt={name ?? userName ?? ""}
                className="size-full rounded-full object-cover"
              />
            </div>
          ) : null}
        </div>

        <PublicProfileReveal
          className="flex flex-col items-center justify-center gap-6 px-4 py-1 sm:flex-row"
          delay={0.2}
          y={8}
        >
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
        </PublicProfileReveal>

        {bio ? (
          <PublicProfileReveal className="px-4 py-1" delay={0.32} y={8}>
            <p className="whitespace-pre-line break-words text-center text-sm leading-7 text-neutral-800">
              {bio}
            </p>
          </PublicProfileReveal>
        ) : null}

        {orderedSocialLinks.length > 0 ? (
          <div className="mt-4 space-y-3 py-2 mb-6">
            <PublicProfileStagger
              className="flex items-center justify-center gap-3"
              delay={0.44}
              stagger={0.055}
              y={6}
            >
              {orderedSocialLinks.map((socialLink) => {
                const label = socialPlatformLabels[socialLink.platform];
                const href = resolveSocialHref(socialLink);

                if (!href) {
                  return null;
                }

                return (
                  <TrackedProfilePageLink
                    key={socialLink.id}
                    href={href}
                    aria-label={label}
                    className="inline-flex size-7 items-center justify-center rounded-full text-foreground group"
                    itemId={socialLink.id}
                    itemKind="social"
                    itemLabel={label}
                    platform={socialLink.platform}
                    profilePageId={profilePageId}
                  >
                    <SocialPlatformIcon
                      platform={socialLink.platform}
                      className="size-full group-hover:scale-125 transition-transform"
                      aria-hidden="true"
                    />
                  </TrackedProfilePageLink>
                );
              })}
            </PublicProfileStagger>
          </div>
        ) : null}

        <div className="flex-1">
          {contentBlocks.map((block, index) => {
            const blockDelay = 0.56 + index * 0.1;

            if (block.type === "links") {
              return (
                <div key={block.id} className="space-y-3 px-4 py-4">
                  <PublicProfileStagger
                    className="space-y-3"
                    delay={blockDelay}
                    stagger={0.09}
                    y={14}
                  >
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
                            <div className="size-12 shrink-0">
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
                  </PublicProfileStagger>
                </div>
              );
            }

            if (block.type === "playlist") {
              return (
                <PublicProfileReveal
                  key={block.item.id}
                  className="my-6 px-4"
                  delay={blockDelay}
                  y={12}
                >
                  <div className="overflow-hidden rounded-md bg-background shadow-float">
                    <PlaylistIframe content={block.item.content} title={block.item.title} />
                  </div>
                </PublicProfileReveal>
              );
            }

            return (
              <PublicProfileReveal
                key={block.item.id}
                className="my-6 space-y-3"
                delay={blockDelay}
                y={12}
              >
                <div className="flex flex-col items-center px-5 py-4">
                  <p className="text-lg font-medium break-all text-center">{block.item.title}</p>
                  {block.item.description ? (
                    <p className="mt-1 break-all text-center text-base leading-6 text-neutral-800">
                      {block.item.description}
                    </p>
                  ) : null}
                </div>
              </PublicProfileReveal>
            );
          })}
        </div>

        <PublicProfileReveal
          className="p-12 text-xs flex items-center justify-center uppercase"
          delay={0.76}
          y={8}
        >
          <Button
            nativeButton={false}
            size={"sm"}
            variant={"link"}
            className={"text-neutral-500"}
            render={
              <Link href={"/api/join"} prefetch={false} className="">
                Create your page
              </Link>
            }
          />
        </PublicProfileReveal>
      </div>
    </section>
  );
}
