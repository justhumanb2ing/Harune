import { getPublicProfilePage } from "@/lib/profile-page/queries";
import { createPageMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

type HandlePageProps = {
  params: Promise<{
    handle: string;
  }>;
};

export async function generateMetadata({ params }: HandlePageProps): Promise<Metadata> {
  const { handle } = await params;
  const owner = await getPublicProfilePage(handle);

  if (!owner?.handle) {
    return {};
  }

  return createPageMetadata({
    path: `/${owner.handle}`,
    title: `${owner.name || owner.userName || owner.handle} on Leeve`,
    description: owner.bio || `Visit @${owner.handle}'s public Leeve page.`,
  });
}

export default async function HandlePage({ params }: HandlePageProps) {
  const { handle } = await params;
  const owner = await getPublicProfilePage(handle);

  if (!owner?.handle) {
    notFound();
  }

  const displayName = owner.name || owner.userName || owner.handle;
  const displayImage = owner.image;

  return (
    <section className="mx-auto flex min-h-screen max-w-3xl items-center px-4 py-12 sm:px-6">
      <div className="w-full rounded-[32px] bg-[linear-gradient(160deg,rgba(249,248,242,1),rgba(255,255,255,0.96))] px-8 py-12 shadow-[0_24px_80px_rgba(15,23,42,0.08)] ring-1 ring-black/5">
        <div className="space-y-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-3">
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-foreground/45">
                Public page
              </p>
              <h1 className="text-4xl font-semibold tracking-tight">{displayName}</h1>
              <p className="text-lg text-foreground/65">@{owner.handle}</p>
            </div>

            {displayImage ? (
              <img
                src={displayImage}
                alt={displayName}
                className="size-20 rounded-2xl border object-cover"
              />
            ) : null}
          </div>

          <div className="rounded-[24px] bg-black px-6 py-5 text-white">
            <p className="text-sm text-white/60">Leeve URL</p>
            <p className="mt-2 text-2xl font-medium">leeve.li / {owner.handle}</p>
          </div>

          {owner.bio ? (
            <p className="max-w-2xl text-base leading-7 text-muted-foreground">{owner.bio}</p>
          ) : (
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-foreground/45">
              Bio not added yet
            </p>
          )}

          {owner.socialLinks.length > 0 ? (
            <div className="space-y-3">
              <p className="text-sm font-medium text-foreground/55">Social links</p>
              <div className="flex flex-wrap gap-2">
                {owner.socialLinks.map((socialLink) => (
                  <a
                    key={socialLink.id}
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

          {owner.linkItems.length > 0 ? (
            <div className="space-y-3">
              <p className="text-sm font-medium text-foreground/55">Links</p>
              <div className="space-y-3">
                {owner.linkItems.map((item) => (
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

          {owner.textBoxItems.length > 0 ? (
            <div className="space-y-3">
              <p className="text-sm font-medium text-foreground/55">Text boxes</p>
              <div className="space-y-3">
                {owner.textBoxItems.map((item) => (
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
