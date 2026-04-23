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
    <main className="max-w-md mx-auto h-full">
      <PublicProfilePage
        handle={owner.handle}
        name={owner.name}
        bio={owner.bio}
        image={owner.image}
        linkBlockPosition={owner.linkBlockPosition}
        linkItems={owner.linkItems}
        socialLinks={owner.socialLinks}
        textBoxItems={owner.textBoxItems}
        userName={owner.userName}
      />
    </main>
  );
}
