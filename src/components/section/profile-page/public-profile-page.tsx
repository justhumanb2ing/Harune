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
import type { LinkItem, SocialLink, SocialPlatform, TextBoxItem } from "@/lib/profile-page/types";
import { FaLinkedinIn, FaYoutube } from "react-icons/fa6";

type PublicProfilePageProps = {
  bio: string | null;
  handle: string;
  image: string | null;
  linkBlockPosition: number;
  linkItems: LinkItem[];
  name: string | null;
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
  bio,
  handle,
  image,
  linkBlockPosition,
  linkItems,
  name,
  socialLinks,
  textBoxItems,
  userName,
}: PublicProfilePageProps) {
  const displayName = name || userName || handle;
  const contentBlocks = getContentBlocks({ linkBlockPosition, linkItems, textBoxItems });
  const visibleSocialLinks = socialLinks
    .map((socialLink) => ({
      ...socialLink,
      href: resolveSocialHref(socialLink),
    }))
    .filter((socialLink): socialLink is SocialLink & { href: string } => Boolean(socialLink.href));

  return (
    <section className="mx-auto flex h-full min-h-full w-full max-w-3xl items-start">
      <div className="h-full w-full rounded-2xl bg-background">
        <div className="flex items-center justify-center px-4 py-4 pt-8">
          {image ? (
            <img src={image} alt={displayName} className="size-36 border object-cover" />
          ) : null}
        </div>

        <div className="flex flex-col items-center justify-center gap-6 px-4 py-1 sm:flex-row">
          <div className="space-y-3">
            <h1 className="text-3xl font-semibold tracking-tight">{displayName}</h1>
          </div>
        </div>

        {bio ? (
          <div className="px-4 py-1">
            <p className="break-words text-center text-sm leading-7 text-neutral-800">{bio}</p>
          </div>
        ) : null}

        {visibleSocialLinks.length > 0 ? (
          <div className="mt-4 space-y-3 py-2">
            <div className="flex items-center justify-center gap-2">
              {visibleSocialLinks.map((socialLink) => {
                const Icon = socialPlatformIcons[socialLink.platform];
                const label = socialPlatformLabels[socialLink.platform];

                return (
                  <a
                    key={socialLink.id}
                    href={socialLink.href}
                    aria-label={label}
                    className="inline-flex size-7 items-center justify-center rounded-full text-foreground"
                  >
                    <Icon className="size-5" aria-hidden="true" />
                  </a>
                );
              })}
            </div>
          </div>
        ) : null}

        {contentBlocks.map((block) => {
          if (block.type === "links") {
            return (
              <div key={block.id} className="space-y-3 px-4 py-4">
                <div className="space-y-3">
                  {block.linkItems.map((item) => {
                    const faviconUrl = resolveFaviconUrl(item.favicon, item.url);

                    return (
                      <a
                        key={item.id}
                        href={item.url}
                        className="flex flex-col gap-2 rounded-sm bg-background p-2 shadow-brand-small"
                      >
                        <div className="flex min-w-0 items-start gap-3">
                          <div className="size-8 shrink-0">
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
                            <p className="flex-1 break-words text-sm leading-snug">{item.title}</p>
                          </div>
                        </div>
                        {item.description ? (
                          <div className="text-xs text-neutral-600">
                            <p className="break-words">{item.description}</p>
                          </div>
                        ) : null}
                      </a>
                    );
                  })}
                </div>
              </div>
            );
          }

          return (
            <div key={block.item.id} className="my-6 space-y-3">
              <div className="flex flex-col items-center px-5 py-4">
                <p className="text-base font-medium">{block.item.title}</p>
                {block.item.description ? (
                  <p className="mt-1 break-words text-center text-sm leading-6 text-neutral-800">
                    {block.item.description}
                  </p>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
