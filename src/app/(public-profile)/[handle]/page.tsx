import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { ProfileBentoPage } from "@/components/profile/public/profile-bento-page";
import { PROFILE_BENTO_SHARE_COPY } from "@/components/profile/share/profile-bento-share-intents";
import { WebPageJsonLd } from "@/components/site-instrumentation/structured-data";
import { ApiError } from "@/lib/api/error";
import { getProfileByHandle } from "@/lib/api/generated/http/profile-api/profile-api";
import type {
  GetProfileByHandle200BentoItem,
  GetProfileByHandle200Page,
  GetProfileByHandle200Viewer,
} from "@/lib/api/generated/http/schemas/profile-api";
import { appConfig } from "@/lib/config";
import { toProfilePageEditorDataFromPublicPage } from "@/lib/profile/public-profile-page";
import { absoluteUrl, createPageMetadata } from "@/lib/seo";
import { getServerMe } from "@/lib/users/server-me";

type HandlePageProps = {
  params: Promise<{
    handle: string;
  }>;
};

export const dynamic = "force-dynamic";

type PublicProfilePageData = {
  page: GetProfileByHandle200Page & {
    userName: string | null;
  };
  bento: GetProfileByHandle200BentoItem[];
  viewer: GetProfileByHandle200Viewer;
};

const toPublicProfilePageData = (data: Awaited<ReturnType<typeof getProfileByHandle>>) => {
  if (data.status !== 200) {
    return null;
  }

  return {
    page: {
      ...data.data.page,
      userName: null,
    },
    bento: data.data.bento,
    viewer: data.data.viewer,
  } satisfies PublicProfilePageData;
};

const getCachedPublicProfileResponse = cache(async (handle: string) => {
  try {
    return await getProfileByHandle(handle, {
      cache: "no-store",
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }

    throw error;
  }
});

const getPublicProfilePage = async (handle: string) => {
  const response = await getCachedPublicProfileResponse(handle);

  if (!response) {
    return null;
  }

  return toPublicProfilePageData(response);
};

export async function generateMetadata({ params }: HandlePageProps): Promise<Metadata> {
  const { handle } = await params;
  const data = await getPublicProfilePage(handle);

  if (!data?.page.handle) {
    return {};
  }

  const title = `${data.page.name || data.page.userName || data.page.handle}`;

  return {
    ...createPageMetadata({
      path: `/${data.page.handle}`,
      title,
      description: PROFILE_BENTO_SHARE_COPY,
      imageAlt: title,
      imagePath: `/${data.page.handle}/opengraph-image`,
      twitterImagePath: `/${data.page.handle}/twitter-image`,
    }),
    title: { absolute: title },
  };
}

export default async function HandlePage({ params }: HandlePageProps) {
  const { handle } = await params;
  const dataPromise = getPublicProfilePage(handle);
  const mePromise = getServerMe();
  const [data, me, initialProfileResponse] = await Promise.all([
    dataPromise,
    mePromise,
    getCachedPublicProfileResponse(handle),
  ]);

  if (!data?.page.handle) {
    notFound();
  }

  const isOwner = me?.profilePage?.handle === data.page.handle;
  const editorData = isOwner ? toProfilePageEditorDataFromPublicPage(data.page) : null;
  const title = `${data.page.name || data.page.userName || data.page.handle} on ${appConfig.projectName}`;

  return (
    <>
      <WebPageJsonLd
        id={absoluteUrl(`/${data.page.handle}`)}
        description={PROFILE_BENTO_SHARE_COPY}
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
          initialProfileResponse={initialProfileResponse}
          initialUser={me}
          viewerProfilePage={me?.profilePage ?? null}
        />
      </main>
    </>
  );
}
