import type {
  DraftLinkItem,
  DraftSocialLink,
  DraftTextBoxItem,
  LinkItem,
  SocialLink,
  TextBoxItem,
} from "@/lib/profile-page/types";

type ProfilePageRendererProps = {
  bio: string | null;
  handle: string;
  image: string | null;
  isPreview?: boolean;
  linkItems: Array<LinkItem | DraftLinkItem>;
  name: string | null;
  socialLinks: Array<SocialLink | DraftSocialLink>;
  textBoxItems: Array<TextBoxItem | DraftTextBoxItem>;
  userName?: string | null;
};

export function ProfilePageRenderer({
  bio,
  handle,
  image,
  isPreview = false,
  linkItems,
  name,
  socialLinks,
  textBoxItems,
  userName,
}: ProfilePageRendererProps) {
  const displayName = name || userName || handle;

  return (
    <section className="mx-auto flex min-h-full w-full max-w-3xl items-center">
      <div className="w-full bg-background">
        <div className="space-y-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-3">
              <h1 className="text-4xl font-semibold tracking-tight">{displayName}</h1>
              <p className="text-lg text-foreground/65">@{handle}</p>
            </div>

            {image ? (
              <img
                src={image}
                alt={displayName}
                className="size-20 rounded-2xl border object-cover"
              />
            ) : null}
          </div>

          <div className="rounded-[24px] bg-black px-6 py-5 text-white">
            <p className="text-sm text-white/60">Leeve URL</p>
            <p className="mt-2 text-2xl font-medium">leeve.li / {handle || "preview"}</p>
          </div>

          {bio ? (
            <p className="max-w-2xl text-base leading-7 text-muted-foreground">{bio}</p>
          ) : (
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-foreground/45">
              Bio not added yet
            </p>
          )}

          {socialLinks.length > 0 ? (
            <div className="space-y-3">
              <p className="text-sm font-medium text-foreground/55">Social links</p>
              <div className="flex flex-wrap gap-2">
                {socialLinks.map((socialLink) => (
                  <a
                    key={socialLink.platform}
                    href={socialLink.url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
                  >
                    {socialLink.platform}
                  </a>
                ))}
              </div>
            </div>
          ) : null}

          {linkItems.length > 0 ? (
            <div className="space-y-3">
              <p className="text-sm font-medium text-foreground/55">Links</p>
              <div className="space-y-3">
                {linkItems.map((item) => (
                  <a
                    key={item.id}
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="block rounded-[24px] border bg-white/70 px-5 py-4 transition-colors hover:bg-white"
                  >
                    <div className="flex items-center gap-3">
                      {item.favicon ? (
                        <img
                          src={item.favicon}
                          alt=""
                          className="size-5 rounded-sm object-contain"
                        />
                      ) : null}
                      <p className="text-base font-medium">{item.title}</p>
                    </div>
                    {item.description ? (
                      <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                    ) : null}
                  </a>
                ))}
              </div>
            </div>
          ) : null}

          {textBoxItems.length > 0 ? (
            <div className="space-y-3">
              <p className="text-sm font-medium text-foreground/55">Text boxes</p>
              <div className="space-y-3">
                {textBoxItems.map((item) => (
                  <div key={item.id} className="rounded-[24px] border bg-white/60 px-5 py-4">
                    <p className="text-base font-medium">{item.title}</p>
                    {item.description ? (
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        {item.description}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
