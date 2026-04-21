import { db } from "@/db";
import { profilePages } from "@/db/schema/profile-page";
import { users } from "@/db/schema/user";
import { createPageMetadata } from "@/lib/seo";
import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

type HandlePageProps = {
  params: Promise<{
    handle: string;
  }>;
};

const getHandleOwner = async (handle: string) => {
  return db
    .select({
      profileName: profilePages.name,
      userName: users.name,
      handle: profilePages.handle,
      bio: profilePages.bio,
      profileImage: profilePages.image,
      userImage: users.image,
      socialLinks: profilePages.socialLinks,
    })
    .from(profilePages)
    .innerJoin(users, eq(profilePages.userId, users.id))
    .where(eq(profilePages.handle, handle))
    .limit(1)
    .then((rows) => rows[0]);
};

export async function generateMetadata({ params }: HandlePageProps): Promise<Metadata> {
  const { handle } = await params;
  const owner = await getHandleOwner(handle);

  if (!owner?.handle) {
    return {};
  }

  return createPageMetadata({
    path: `/${owner.handle}`,
    title: `${owner.profileName || owner.userName || owner.handle} on Leeve`,
    description: owner.bio || `Visit @${owner.handle}'s public Leeve page.`,
  });
}

export default async function HandlePage({ params }: HandlePageProps) {
  const { handle } = await params;
  const owner = await getHandleOwner(handle);

  if (!owner?.handle) {
    notFound();
  }

  const displayName = owner.profileName || owner.userName || owner.handle;
  const displayImage = owner.profileImage || owner.userImage;
  const activeSocialLinks = Object.entries(owner.socialLinks || {}).filter(
    ([, value]) => typeof value === "string" && value.length > 0
  );

  return (
    <section className="mx-auto flex min-h-[calc(100vh-10rem)] max-w-3xl items-center py-16">
      <div className="w-full rounded-[32px] bg-[linear-gradient(160deg,rgba(249,248,242,1),rgba(255,255,255,0.96))] px-8 py-12 shadow-[0_24px_80px_rgba(15,23,42,0.08)] ring-1 ring-black/5">
        <div className="space-y-6">
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

          {activeSocialLinks.length > 0 ? (
            <div className="space-y-3">
              <p className="text-sm font-medium text-foreground/55">Social links</p>
              <div className="flex flex-wrap gap-2">
                {activeSocialLinks.map(([platform, value]) => (
                  <a
                    key={platform}
                    href={value}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
                  >
                    {platform}
                  </a>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
