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
import type {
  DraftLinkItem,
  DraftSocialLink,
  DraftTextBoxItem,
  LinkItem,
  SocialLink,
  TextBoxItem,
} from "@/lib/profile-page/types";
import { cn } from "@/lib/utils";
import { FaLinkedinIn, FaYoutube } from "react-icons/fa6";

type ProfilePageRendererProps = {
  backgroundImage: string | null;
  bio: string | null;
  framed?: boolean;
  handle: string;
  image: string | null;
  isPreview?: boolean;
  linkBlockPosition: number;
  linkItems: Array<LinkItem | DraftLinkItem>;
  location: string | null;
  name: string | null;
  role: string | null;
  socialLinks: Array<SocialLink | DraftSocialLink>;
  textBoxItems: Array<TextBoxItem | DraftTextBoxItem>;
  userName?: string | null;
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

function getContentBlocks({
  linkBlockPosition,
  linkItems,
  textBoxItems,
}: {
  linkBlockPosition: number;
  linkItems: Array<LinkItem | DraftLinkItem>;
  textBoxItems: Array<TextBoxItem | DraftTextBoxItem>;
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

export function ProfilePageRenderer({
  backgroundImage,
  bio,
  framed = true,
  handle,
  image,
  isPreview = false,
  linkBlockPosition,
  linkItems,
  location,
  name,
  role,
  socialLinks,
  textBoxItems,
  userName,
}: ProfilePageRendererProps) {
  const contentBlocks = getContentBlocks({
    linkBlockPosition,
    linkItems,
    textBoxItems,
  });

  return (
    <section className="mx-auto flex min-h-full h-full w-full items-center">
      <div
        className={cn(
          "w-full overflow-x-hidden scrollbar-hidden",
          framed ? "h-[700px] overflow-y-auto" : "h-auto overflow-y-visible",
          framed && "rounded-[2rem] border border-border/60 shadow-brand"
        )}
      >
        <div
          className={cn(
            "min-h-full overflow-hidden bg-background bg-cover bg-center cursor-default relative",
            framed && "rounded-2xl"
          )}
        >
          <div className="relative z-10">
            <div
              className={cn(
                "group relative flex h-60 items-center justify-center px-4 hover:bg-black/5",
                backgroundImage && "mb-20 h-48"
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
                  alt={name ?? ""}
                  className={cn(
                    "relative z-10 size-32 object-cover rounded-full",
                    backgroundImage && "translate-y-24"
                  )}
                />
              ) : null}
            </div>

            <div className="flex flex-col gap-6 sm:flex-row items-center justify-center px-4 mt-0 mb-2 hover:bg-black/5 py-1">
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

            {bio && (
              <div className="hover:bg-black/5 py-1 px-4">
                <p className="whitespace-pre-line text-sm leading-7 text-center text-neutral-800 break-all">
                  {bio}
                </p>
              </div>
            )}

            {socialLinks.length > 0 ? (
              <div className="space-y-3 mt-4 hover:bg-black/5 py-2">
                <div className="flex justify-center items-center gap-2">
                  {socialLinks.map((socialLink) => {
                    const Icon = socialPlatformIcons[socialLink.platform];

                    return (
                      <Button
                        key={socialLink.platform}
                        type="button"
                        variant={"ghost"}
                        size={"icon-sm"}
                        className={"rounded-full hover:bg-transparent cursor-default"}
                      >
                        <Icon className="size-5" aria-hidden="true" />
                      </Button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {contentBlocks.map((block) => {
              if (block.type === "links") {
                return (
                  <div key={block.id} className="hover:bg-black/5 px-4 py-4">
                    <div className="space-y-3">
                      {block.linkItems.map((item) => {
                        const faviconUrl = resolveFaviconUrl(item.favicon, item.url);

                        return (
                          <div
                            key={item.id}
                            className="bg-background shadow-float rounded-md p-2 flex flex-col gap-2"
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
                              <div className="flex items-center self-stretch min-w-0">
                                <p className="flex-1 text-sm leading-snug truncate line-clamp-1 font-medium">
                                  {item.title}
                                </p>
                              </div>
                            </div>
                            {/*{item.description && (
                              <div className="text-xs text-neutral-600 break-all">
                                <p>{item.description}asdfmlasdkmflaksdmflkasmdflkmasklfmlkasdflkasmdklfmaslkdmflkasmfl</p>
                              </div>
                            )}*/}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              }

              return (
                <div key={block.item.id} className="space-y-3 hover:bg-black/5 my-4">
                  <div className="px-5 py-4 flex flex-col items-center">
                    <p className="text-base font-medium break-all text-center">
                      {block.item.title}
                    </p>
                    {block.item.description ? (
                      <p className="text-center mt-1 text-sm leading-6 text-neutral-800 break-all">
                        {block.item.description}
                      </p>
                    ) : null}
                  </div>
                </div>
              );
            })}

            <div className="p-12 text-xs flex items-center justify-center text-primary uppercase" />
          </div>
        </div>
      </div>
    </section>
  );
}
