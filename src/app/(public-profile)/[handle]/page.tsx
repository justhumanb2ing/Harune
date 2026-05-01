import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { ProfileBentoPage } from "@/components/profile-page/v2/profile-bento-page";
import { WebPageJsonLd } from "@/components/site-instrumentation/structured-data";
import { appConfig } from "@/lib/config";
import {
  getOwnedProfilePage,
  getProfilePageEditorData,
  getPublicProfileBentoPage,
} from "@/lib/profile-page/queries";
import type { ProfilePageData } from "@/lib/profile-page/types";
import { absoluteUrl, createPageMetadata } from "@/lib/seo";

type HandlePageProps = {
  params: Promise<{
    handle: string;
  }>;
};

export const dynamic = "force-dynamic";

const toSerializableProfilePageData = (
  data: Awaited<ReturnType<typeof getProfilePageEditorData>>
) =>
  data
    ? ({
        page: {
          id: data.page.id,
          handle: data.page.handle,
          linkBlockPosition: data.page.linkBlockPosition,
          location: data.page.location,
          name: data.page.name,
          role: data.page.role,
          bio: data.page.bio,
          image: data.page.image,
          backgroundImage: data.page.backgroundImage,
        },
        socialLinks: data.socialLinks,
        linkItems: data.linkItems,
        playlistItems: data.playlistItems,
        textBoxItems: data.textBoxItems,
      } satisfies ProfilePageData)
    : null;

export async function generateMetadata({ params }: HandlePageProps): Promise<Metadata> {
  const { handle } = await params;
  const data = await getPublicProfileBentoPage(handle);

  if (!data?.page.handle) {
    return {};
  }

  const title = `${data.page.name || data.page.userName || data.page.handle}`;

  return createPageMetadata({
    path: `/${data.page.handle}`,
    title,
    description: data.page.bio || `Visit @${data.page.handle}'s page.`,
    imageAlt: title,
    imagePath: `/${data.page.handle}/opengraph-image`,
    twitterImagePath: `/${data.page.handle}/twitter-image`,
  });
}

export default async function HandlePage({ params }: HandlePageProps) {
  const { handle } = await params;
  const [data, session] = await Promise.all([getPublicProfileBentoPage(handle), auth()]);

  if (!data?.page.handle) {
    notFound();
  }

  const [editorData, viewerProfilePage] = session?.user?.id
    ? await Promise.all([
        getProfilePageEditorData(session.user.id, data.page.handle).then(
          toSerializableProfilePageData
        ),
        getOwnedProfilePage(session.user.id),
      ])
    : [null, null];
  const isOwner = editorData?.page.id === data.page.id;
  const title = `${data.page.name || data.page.userName || data.page.handle} on ${appConfig.projectName}`;

  return (
    <>
      <WebPageJsonLd
        id={absoluteUrl(`/${data.page.handle}`)}
        description={data.page.bio || `Visit @${data.page.handle}'s page.`}
        title={title}
        lastUpdated={data.page.updatedAt}
        isAccessibleForFree
        publisher={{
          "@type": "Organization",
          name: appConfig.projectName,
          url: appConfig.url,
        }}
        about={{
          "@type": "Thing",
          name: data.page.handle,
        }}
      />
      <main className="min-h-lvh bg-background">
        <ProfileBentoPage
          page={data.page}
          bento={data.bento}
          editorData={editorData}
          isOwner={isOwner}
          viewerProfilePage={viewerProfilePage}
        />
      </main>
    </>
  );
}
