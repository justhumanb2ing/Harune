import { PublicProfilePage } from "@/components/section/profile-page/public-profile-page";
import { getPublicProfilePage } from "@/lib/profile-page/queries";
import { createPageMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

type HandlePageProps = {
  params: Promise<{
    handle: string;
  }>;
};

export const dynamic = "force-dynamic";

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

  return (
    <main className="max-w-lg mx-auto h-full">
      <PublicProfilePage
        profilePageId={owner.id}
        backgroundImage={owner.backgroundImage}
        handle={owner.handle}
        name={owner.name}
        bio={owner.bio}
        image={owner.image}
        linkBlockPosition={owner.linkBlockPosition}
        linkItems={owner.linkItems}
        location={owner.location}
        socialLinks={owner.socialLinks}
        role={owner.role}
        textBoxItems={owner.textBoxItems}
        userName={owner.userName}
      />
    </main>
  );
}
