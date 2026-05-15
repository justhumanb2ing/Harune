import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { cache } from "react";
import { ProfileBentoPage } from "@/components/profile/v2/profile-bento-page";
import { WebPageJsonLd } from "@/components/site-instrumentation/structured-data";
import { ApiError } from "@/lib/api/error";
import { getMeAnalytics } from "@/lib/api/generated/http/me-api/me-api";
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

const getOwnerAnalyticsViews = async (cookieHeader: string) => {
  if (!cookieHeader) {
    return 0;
  }

  try {
    const response = await getMeAnalytics({
      cache: "no-store",
      headers: {
        cookie: cookieHeader,
      },
    });

    if (response.status !== 200) {
      return 0;
    }

    return response.data.visitors ?? 0;
  } catch {
    return 0;
  }
};

export async function generateMetadata({ params }: HandlePageProps): Promise<Metadata> {
  const { handle } = await params;
  const data = await getPublicProfilePage(handle);

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
  const cookieHeader = (await cookies()).toString();
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
  const analyticsViews = isOwner ? await getOwnerAnalyticsViews(cookieHeader) : 0;
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
          initialProfileResponse={initialProfileResponse}
          initialUser={me}
          analyticsViews={analyticsViews}
          viewerProfilePage={me?.profilePage ?? null}
        />
      </main>
    </>
  );
}
