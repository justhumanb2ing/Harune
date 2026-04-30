import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { WebPageJsonLd } from "next-seo";
import { PublicProfilePage } from "@/components/profile-page/live-page/live-page";
import { appConfig } from "@/lib/config";
import { getPublicProfilePage } from "@/lib/profile-page/queries";
import { absoluteUrl, createPageMetadata } from "@/lib/seo";

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
    title: `${owner.name || owner.userName || owner.handle} on ${appConfig.projectName}`,
    description: owner.bio || `Visit @${owner.handle}'s page.`,
    imageAlt: `${owner.name || owner.userName || owner.handle} on ${appConfig.projectName}`,
    imagePath: `/${owner.handle}/opengraph-image`,
    twitterImagePath: `/${owner.handle}/twitter-image`,
  });
}

export default async function HandlePage({ params }: HandlePageProps) {
  const { handle } = await params;
  const owner = await getPublicProfilePage(handle);

  if (!owner?.handle) {
    notFound();
  }

  return (
    <>
      <WebPageJsonLd
        useAppDir
        id={absoluteUrl(`/${owner.handle}`)}
        title={`${owner.name || owner.userName || owner.handle} on ${appConfig.projectName}`}
        description={owner.bio || `Visit @${owner.handle}'s page.`}
        lastUpdated={owner.updatedAt}
        isAccessibleForFree={true}
        publisher={{
          "@type": "Organization",
          name: appConfig.projectName,
          url: appConfig.url,
        }}
        about={{
          "@type": "Thing",
          name: owner.handle,
        }}
      />
      <main className="mx-auto min-h-lvh max-w-lg">
        <PublicProfilePage
          profilePageId={owner.id}
          backgroundImage={owner.backgroundImage}
          handle={owner.handle}
          name={owner.name}
          bio={owner.bio}
          image={owner.image}
          linkBlockPosition={owner.linkBlockPosition}
          linkItems={owner.linkItems}
          playlistItems={owner.playlistItems}
          location={owner.location}
          socialLinks={owner.socialLinks}
          role={owner.role}
          textBoxItems={owner.textBoxItems}
          userName={owner.userName}
        />
      </main>
    </>
  );
}
